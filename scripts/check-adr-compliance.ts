/**
 * Architecture invariant compliance harness.
 *
 * Walks every binding architecture invariant that is mechanically
 * checkable and emits PASS / WARN / FAIL. WARN indicates an in-flight
 * transition; FAIL exits non-zero and blocks the build.
 *
 * Add a new check by appending a function to `CHECKS` below. Each
 * function returns `{ adr, title, status, message }`, where `adr` is a
 * stable identifier for the invariant. The harness does not need a
 * registry update.
 *
 * The binding invariants live in `.claude/rules/architecture.md`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

type Status = "PASS" | "WARN" | "FAIL";

interface CheckResult {
  readonly adr: string;
  readonly title: string;
  readonly status: Status;
  readonly message: string;
}

type CheckFunction = () => CheckResult | readonly CheckResult[];

/**
 * Read a UTF-8 file; return `null` when the path does not exist.
 */
function readText(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/**
 * Walk a directory recursively and yield every regular file path.
 *
 * Skips build artefacts (`node_modules`, `dist`, `.vite`) and ephemeral
 * subagent worktrees (`.claude/worktrees`) so the harness reflects the
 * canonical tree, not parallel checkouts that subagents create.
 */
function* walkFiles(root: string): Generator<string> {
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root)) {
    if (
      entry === "node_modules" ||
      entry === "dist" ||
      entry === ".vite" ||
      entry === ".svelte-kit" ||
      entry === "worktrees"
    )
      continue;
    const full = resolve(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) yield* walkFiles(full);
    else if (stat.isFile()) yield full;
  }
}

/**
 * Count occurrences of a regex across every file under `root` matched
 * by `extensions`. Returns paths and per-file match counts.
 */
function grepFiles(
  root: string,
  pattern: RegExp,
  extensions: readonly string[]
): readonly { readonly path: string; readonly count: number }[] {
  const hits: { path: string; count: number }[] = [];
  for (const path of walkFiles(root)) {
    if (!extensions.some((ext) => path.endsWith(ext))) continue;
    const source = readText(path);
    if (source === null) continue;
    const matches = source.match(pattern);
    if (matches !== null) hits.push({ path, count: matches.length });
  }
  return hits;
}

/**
 * Verify every package under packages/ carries the expected version.
 */
function checkPackageVersions(): CheckResult {
  const expected = "2.0.0";
  const violations: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, "packages"))) {
    const manifest = readText(resolve(REPO_ROOT, "packages", entry, "package.json"));
    if (manifest === null) continue;
    const match = manifest.match(/"version":\s*"([^"]+)"/);
    if (match === null || match[1] !== expected) {
      violations.push(`${entry}: ${match?.[1] ?? "unset"}`);
    }
  }
  if (violations.length > 0) {
    return {
      adr: "ADR-0005",
      title: "v2.0.0 breaking release",
      status: "FAIL",
      message: `Every package must declare version ${expected}: ${violations.join(", ")}`,
    };
  }
  return {
    adr: "ADR-0005",
    title: "v2.0.0 breaking release",
    status: "PASS",
    message: `Every package declares ${expected}.`,
  };
}

/**
 * ADR-0006 retires `.claude/rules/cross-framework.md`. Retirement means
 * two things: the file is gone, and no surviving artefact still points at
 * the retired rule or the never-shipped `check-cross-framework-parity.ts`
 * scan. The guard fails on either signal so a stale reference cannot rot
 * undetected after the file leaves the tree.
 *
 * The dangling-reference scan covers `.claude/`, each adapter's `src/`,
 * and `scripts/` for `.md`, `.ts`, and `.tsx` sources. It skips `docs/`
 * because historical ADRs and plans legitimately cite the retired file as
 * history, and skips this harness, which carries the literal token in its
 * own regex. The pattern escapes the dots so `cross-framework-reviewer.md`
 * (the live subagent file) does not false-match.
 */
function checkCrossFrameworkRuleRetired(): CheckResult {
  const filePath = resolve(REPO_ROOT, ".claude/rules/cross-framework.md");
  if (existsSync(filePath)) {
    return {
      adr: "ADR-0006",
      title: "Retire cross-framework.md",
      status: "FAIL",
      message: ".claude/rules/cross-framework.md still exists; ADR-0006 retires it.",
    };
  }
  const danglingPattern = /cross-framework\.md|check-cross-framework-parity\.ts/g;
  const selfPath = resolve(REPO_ROOT, "scripts/check-adr-compliance.ts");
  const scanRoots = [
    resolve(REPO_ROOT, ".claude"),
    resolve(REPO_ROOT, "packages/react/src"),
    resolve(REPO_ROOT, "packages/vue/src"),
    resolve(REPO_ROOT, "packages/svelte/src"),
    resolve(REPO_ROOT, "scripts"),
  ];
  const danglingRefs = scanRoots
    .flatMap((root) => grepFiles(root, danglingPattern, [".md", ".ts", ".tsx"]))
    // Exclude this harness (carries the literal token in its regex) and any
    // generated `.d.ts` declaration that mirrors a `.ts` source comment.
    .filter((hit) => hit.path !== selfPath && !hit.path.endsWith(".d.ts"));
  if (danglingRefs.length > 0) {
    const offenders = danglingRefs
      .map((hit) => `${hit.path.replace(`${REPO_ROOT}/`, "")} (${hit.count})`)
      .join(", ");
    return {
      adr: "ADR-0006",
      title: "Retire cross-framework.md",
      status: "FAIL",
      message: `.claude/rules/cross-framework.md is removed, but live references to the retired names remain: ${offenders}. Redirect each to .claude/rules/feature-manifest.md, scripts/check-feature-parity.ts, or scripts/check-ct-parity.ts.`,
    };
  }
  return {
    adr: "ADR-0006",
    title: "Retire cross-framework.md",
    status: "PASS",
    message:
      ".claude/rules/cross-framework.md is removed and no live reference to the retired names remains.",
  };
}

/**
 * Framework adapters delegate global listeners and DOM observers to
 * controllers from @vizel/core or @vizel/headless. Direct calls to
 * document/window listeners and direct construction of MutationObserver
 * / ResizeObserver inside packages/{react,vue,svelte}/src/ are
 * forbidden by ADR-0007.
 */
function checkControllerDelegation(): readonly CheckResult[] {
  const forbiddenPatterns =
    /document\.addEventListener\b|window\.addEventListener\b|new\s+MutationObserver\b|new\s+ResizeObserver\b/g;
  const results: CheckResult[] = [];
  for (const framework of ["react", "vue", "svelte"] as const) {
    const root = resolve(REPO_ROOT, "packages", framework, "src");
    const hits = grepFiles(root, forbiddenPatterns, [".ts", ".tsx", ".vue", ".svelte"]);
    const total = hits.reduce((sum, hit) => sum + hit.count, 0);
    if (total === 0) {
      results.push({
        adr: "ADR-0007",
        title: `controller delegation (${framework})`,
        status: "PASS",
        message: `${framework}: zero direct document/window listeners and zero direct MutationObserver/ResizeObserver constructions.`,
      });
      continue;
    }
    const filesList = hits
      .map((hit) => `${hit.path.replace(`${REPO_ROOT}/`, "")} (${hit.count})`)
      .join(", ");
    const phaseByFramework: Record<"react" | "vue" | "svelte", string> = {
      react: "Phase 3a-step2 (PR #564)",
      vue: "Phase 3b-step2",
      svelte: "Phase 3c-step2",
    };
    const phase = phaseByFramework[framework];
    results.push({
      adr: "ADR-0007",
      title: `controller delegation (${framework})`,
      status: "WARN",
      message: `${framework}: ${phase} closes the gap; ${total} listener/observer call(s) remain. Promote to FAIL after the phase merges. Files: ${filesList}.`,
    });
  }
  return results;
}

/**
 * Every Vizel*.{tsx,vue,svelte} component file stays at or under 120
 * view-template lines. The harness counts the JSX block for React,
 * the <template> block for Vue, and the markup block for Svelte.
 *
 * Status is per-framework so a framework that already completed its
 * Phase 3 rewrite can PASS while a framework still in flight WARNs.
 * Each adapter promotes from WARN to FAIL once its Phase 3 sub-phase
 * lands; Phase 3a (React) is already in flight, so React FAILs on
 * violations.
 */
function checkComponentSize(): readonly CheckResult[] {
  const limit = 120;
  const phaseGuard: Record<"react" | "vue" | "svelte", { status: Status; phase: string }> = {
    react: { status: "FAIL", phase: "Phase 3a is in flight; React must reach zero violations." },
    vue: { status: "WARN", phase: "Phase 3b will close the gap." },
    svelte: { status: "WARN", phase: "Phase 3c will close the gap." },
  };
  const results: CheckResult[] = [];
  for (const framework of ["react", "vue", "svelte"] as const) {
    const dir = resolve(REPO_ROOT, "packages", framework, "src", "components");
    if (!existsSync(dir)) continue;
    const violations: string[] = [];
    for (const entry of readdirSync(dir)) {
      if (!isComponentFile(framework, entry)) continue;
      const path = resolve(dir, entry);
      const source = readText(path);
      if (source === null) continue;
      const viewLines = extractViewBlockLineCount(framework, source);
      if (viewLines > limit) {
        violations.push(`${framework}/${entry} = ${viewLines}`);
      }
    }
    if (violations.length === 0) {
      results.push({
        adr: "ADR-0007",
        title: `120-line component size budget (${framework})`,
        status: "PASS",
        message: `${framework}: every component stays at or under ${limit} view-template lines.`,
      });
      continue;
    }
    const guard = phaseGuard[framework];
    results.push({
      adr: "ADR-0007",
      title: `120-line component size budget (${framework})`,
      status: guard.status,
      message: `${guard.phase} Files over budget: ${violations.join(", ")}`,
    });
  }
  return results;
}

/**
 * Distinguish a framework component file from a barrel or helper that
 * happens to live in components/.
 */
function isComponentFile(framework: "react" | "vue" | "svelte", entry: string): boolean {
  if (framework === "react") return entry.endsWith(".tsx") && !entry.endsWith(".d.ts");
  if (framework === "vue") return entry.endsWith(".vue");
  return entry.endsWith(".svelte");
}

/**
 * Strip JavaScript block (`/* ... *\/`) and line (`// ...`) comments
 * from a source string so downstream regex scans skip JSDoc snippets
 * that quote real syntax (e.g., `@example return (` inside JSDoc).
 *
 * The substitution loses original line numbers; callers that depend
 * on line offsets must not use the result.
 */
function stripJsComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Return `true` when the node is a JSX element, fragment, or self-closing tag. */
const isJsxNode = (node: ts.Node): boolean =>
  ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node);

/**
 * Return the name a function-like declaration introduces, or `null`.
 *
 * The discovery recognises two component shapes: a `function Vizel()`
 * declaration and an `export const Vizel = (...) => ...` arrow bound to a
 * single named variable. Two adapter files (`VizelIconContext`,
 * `VizelThemeContext`) use the `export const` form, so the AST scan must
 * read the variable name, not only the function-declaration name.
 */
function functionLikeName(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node)) return node.name?.text ?? null;
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const initializer = node.initializer;
    if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
      return node.name.text;
    }
  }
  return null;
}

/**
 * Return the function body that holds a declaration's render markup.
 *
 * A `function` declaration carries its body directly; an `export const`
 * arrow carries the body on its initializer.
 */
function functionLikeBody(node: ts.Node): ts.Node | null {
  if (ts.isFunctionDeclaration(node)) return node.body ?? null;
  if (ts.isVariableDeclaration(node)) {
    const initializer = node.initializer;
    if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
      return initializer.body;
    }
  }
  return null;
}

/** Collect every JSX node contained in `root` into `into`. */
function collectJsxNodes(root: ts.Node, into: ts.Node[]): void {
  const visit = (node: ts.Node): void => {
    if (isJsxNode(node)) into.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
}

/**
 * Measure a React component's view markup as the line span across the
 * union of its JSX nodes.
 *
 * The TypeScript compiler API parses the `.tsx`, then discovers every
 * component whose name matches `/^Vizel/` (function declaration or
 * `export const` arrow) plus every non-component helper render function in
 * the file. The span runs from the minimum JSX `getStart()` to the maximum
 * JSX `getEnd()`, counted in lines, so a component that delegates its
 * markup to a local helper is measured rather than silently scored 0.
 * Returns 0 when the file contains no JSX.
 */
function measureReactViewLineSpan(source: string): number {
  const sourceFile = ts.createSourceFile(
    "component.tsx",
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX
  );
  const jsxNodes: ts.Node[] = [];
  const visit = (node: ts.Node): void => {
    const name = functionLikeName(node);
    const body = functionLikeBody(node);
    if (body !== null) {
      const isComponent = name !== null && /^Vizel/.test(name);
      const containsJsx: ts.Node[] = [];
      collectJsxNodes(body, containsJsx);
      // Include the body's JSX when the declaration is a Vizel* component
      // or a non-component helper render function (a function that returns
      // JSX). Both cases contribute to the union so a component that
      // delegates its markup to a helper is not under-counted.
      if (isComponent || containsJsx.length > 0) {
        jsxNodes.push(...containsJsx);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (jsxNodes.length === 0) return 0;
  const start = Math.min(...jsxNodes.map((node) => node.getStart(sourceFile)));
  const end = Math.max(...jsxNodes.map((node) => node.getEnd()));
  const startLine = sourceFile.getLineAndCharacterOfPosition(start).line;
  const endLine = sourceFile.getLineAndCharacterOfPosition(end).line;
  return endLine - startLine + 1;
}

/**
 * Extract the view-template block from a component source and return
 * its line count. Returns 0 when the framework has no detectable
 * template block (e.g., a TS-only file dropped into components/).
 *
 * Each framework branch resists a known false-positive class:
 *
 * - React: a regex over `return ( ... );` under-counts multi-return,
 *   early-return, and parenthesis-free components, and silently scores 0
 *   when a component delegates its markup to a helper. The React branch
 *   instead parses the `.tsx` with the TypeScript compiler API, discovers
 *   each Vizel* component (function declaration or `export const` arrow),
 *   collects the JSX nodes from the union of that component body and every
 *   non-component helper render function, and measures the line span from
 *   the minimum JSX `getStart()` to the maximum JSX `getEnd()`.
 * - Vue: nested `<template v-if>` / `<template v-for>` blocks make a
 *   non-greedy `<template>...</template>` stop at the first inner
 *   `</template>`. Slice from the first outermost `<template>` to the
 *   last `</template>` instead.
 * - Svelte: files with both `<script module>` and `<script>` carry
 *   two `</script>` tags. Match from the last `</script>` so the
 *   second script block does not count as view markup.
 */
function extractViewBlockLineCount(framework: "react" | "vue" | "svelte", source: string): number {
  if (framework === "react") {
    return measureReactViewLineSpan(source);
  }
  if (framework === "vue") {
    const openIndex = source.indexOf("<template>");
    const closeIndex = source.lastIndexOf("</template>");
    if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) return 0;
    const inner = source.slice(openIndex + "<template>".length, closeIndex);
    return inner.split("\n").length;
  }
  const lastScriptClose = source.lastIndexOf("</script>");
  if (lastScriptClose === -1) return source.split("\n").length;
  return source.slice(lastScriptClose + "</script>".length).split("\n").length;
}

/**
 * Every adapter's `dist/styles.css` must be a re-export shim that
 * defers to `@vizel/core/styles.css`. PR #570 landed the shim
 * mechanism: `package.json` keeps `./dist/styles.css` as the export
 * path; the post-build script `write-style-shims.mjs` emits a two-line
 * file at that path carrying the sentinel comment
 * `/* vizel-style-shim: re-export of @vizel/core/styles.css; do not edit. *\/`
 * plus an `@import` of the Core catalogue. The harness looks for the
 * sentinel in the built shim and falls back to the build script when
 * the dist file is absent (pre-build CI run).
 */
function checkCssCentralisation(): CheckResult {
  // The sentinel string is identical to the one `write-style-shims.mjs`
  // emits inside every shim. Detecting the string in either the dist
  // shim or the script proves the re-export contract holds without
  // duplicating the catalogue across packages.
  const sentinel = "vizel-style-shim: re-export of @vizel/core/styles.css; do not edit.";
  const offenders: string[] = [];
  for (const framework of ["react", "vue", "svelte"] as const) {
    const distPath = resolve(REPO_ROOT, "packages", framework, "dist", "styles.css");
    const dist = readText(distPath);
    if (dist?.includes(sentinel)) continue;
    // Pre-build runs lack `dist/`. The build script ships the sentinel
    // string, so its presence in the script proves the next build emits
    // the shim. The check tolerates either signal because CI runs the
    // harness before `pnpm build` on some workflows.
    const scriptPath = resolve(
      REPO_ROOT,
      "packages",
      framework,
      "scripts",
      "write-style-shims.mjs"
    );
    const script = readText(scriptPath);
    if (script?.includes(sentinel)) continue;
    offenders.push(
      `${framework}: missing the re-export sentinel in dist/styles.css and scripts/write-style-shims.mjs`
    );
  }
  if (offenders.length === 0) {
    return {
      adr: "ADR-0008",
      title: "CSS centralisation",
      status: "PASS",
      message:
        "Every adapter ships a re-export shim that defers to @vizel/core/styles.css (sentinel verified).",
    };
  }
  return {
    adr: "ADR-0008",
    title: "CSS centralisation",
    status: "WARN",
    message: `Each adapter must ship dist/styles.css as a re-export shim with the ADR-0008 sentinel; pre-build runs may instead carry the sentinel in scripts/write-style-shims.mjs. ${offenders.join(", ")}`,
  };
}

/**
 * @tiptap/react and @tiptap/vue-3 must not appear in any import or
 * package.json dependency anywhere in the repository.
 *
 * The import check matches `from "@tiptap/react"` (and the Vue 3
 * equivalent) so that JSDoc references to the retired packages do not
 * register as violations. The harness script itself names the packages
 * in literal regex patterns, so the check skips its own file.
 */
function checkFirstPartyTiptap(): readonly CheckResult[] {
  const importPattern = /from\s+["']@tiptap\/(react|vue-3)["']/g;
  const selfPath = resolve(REPO_ROOT, "scripts/check-adr-compliance.ts");
  const sourceHits = grepFiles(REPO_ROOT, importPattern, [".ts", ".tsx", ".vue", ".svelte"]).filter(
    (hit) => hit.path !== selfPath
  );
  const dependencyHits: string[] = [];
  for (const scope of ["packages", "apps"] as const) {
    const root = resolve(REPO_ROOT, scope);
    if (!existsSync(root)) continue;
    for (const path of walkFiles(root)) {
      if (!path.endsWith("package.json")) continue;
      const content = readText(path) ?? "";
      if (/"@tiptap\/(react|vue-3)"/.test(content)) {
        dependencyHits.push(path.replace(`${REPO_ROOT}/`, ""));
      }
    }
  }
  const results: CheckResult[] = [];
  results.push(
    sourceHits.length === 0
      ? {
          adr: "ADR-0009",
          title: "no @tiptap/react or @tiptap/vue-3 imports",
          status: "PASS",
          message: "Zero @tiptap/react or @tiptap/vue-3 imports across packages, apps, and tests.",
        }
      : {
          adr: "ADR-0009",
          title: "no @tiptap/react or @tiptap/vue-3 imports",
          status: "FAIL",
          message: `Import violations: ${sourceHits.map((hit) => hit.path.replace(`${REPO_ROOT}/`, "")).join(", ")}`,
        }
  );
  results.push(
    dependencyHits.length === 0
      ? {
          adr: "ADR-0009",
          title: "no @tiptap/react or @tiptap/vue-3 in package.json",
          status: "PASS",
          message: "No adapter declares @tiptap/react or @tiptap/vue-3 as a dependency.",
        }
      : {
          adr: "ADR-0009",
          title: "no @tiptap/react or @tiptap/vue-3 in package.json",
          status: "FAIL",
          message: `Dependency violations: ${dependencyHits.join(", ")}`,
        }
  );
  return results;
}

/**
 * Extract the YAML frontmatter block between the first two `---` lines.
 * Return `null` when the file lacks a frontmatter block.
 */
function extractFrontmatter(source: string): string | null {
  if (!source.startsWith("---")) return null;
  const remainder = source.slice(3);
  const endIndex = remainder.indexOf("\n---");
  if (endIndex === -1) return null;
  return remainder.slice(0, endIndex);
}

/**
 * Every skill carries description and when_to_use frontmatter. Path-
 * scoped skills (skills that the harness considers path-scoped) also
 * carry a `paths:` field. ADR-0010 documents the official Claude Code
 * spec. The check parses the YAML frontmatter block between the first
 * two `---` markers and verifies the required keys appear there, not
 * anywhere in the file body.
 */
function checkSkillFrontmatter(): CheckResult {
  const skillsRoot = resolve(REPO_ROOT, ".claude/skills");
  if (!existsSync(skillsRoot)) {
    return {
      adr: "ADR-0010",
      title: ".claude/ official format (skills)",
      status: "WARN",
      message: ".claude/skills/ not present yet; PR #559 will introduce it.",
    };
  }
  const offenders: string[] = [];
  for (const skill of readdirSync(skillsRoot)) {
    const skillFile = resolve(skillsRoot, skill, "SKILL.md");
    const source = readText(skillFile);
    if (source === null) continue;
    const frontmatter = extractFrontmatter(source);
    if (frontmatter === null) {
      offenders.push(`${skill}: missing frontmatter block`);
      continue;
    }
    if (!/^description:\s*\S/m.test(frontmatter)) offenders.push(`${skill}: missing description`);
    if (!/^when_to_use:\s*\S/m.test(frontmatter)) offenders.push(`${skill}: missing when_to_use`);
    // Every shipped skill under .claude/skills/ is path-scoped per the
    // current rule catalogue, so paths: presence is required.
    if (!(/^paths:\s*$/m.test(frontmatter) || /^paths:\s*\[/m.test(frontmatter))) {
      offenders.push(`${skill}: missing paths:`);
    }
  }
  if (offenders.length === 0) {
    return {
      adr: "ADR-0010",
      title: ".claude/ official format (skills)",
      status: "PASS",
      message: "Every skill carries description, when_to_use, and paths: frontmatter.",
    };
  }
  return {
    adr: "ADR-0010",
    title: ".claude/ official format (skills)",
    status: "WARN",
    message: `Skill frontmatter gap (closes with PR #559 merge): ${offenders.join(", ")}`,
  };
}

/**
 * The technical-writing rule ships with paths-scoped frontmatter.
 */
function checkWritingRule(): CheckResult {
  const path = resolve(REPO_ROOT, ".claude/rules/writing.md");
  const source = readText(path);
  if (source === null) {
    return {
      adr: "ADR-0011",
      title: "technical-writing rule",
      status: "WARN",
      message: ".claude/rules/writing.md not present yet; PR #559 will introduce it.",
    };
  }
  if (!(source.startsWith("---") && source.includes("paths:"))) {
    return {
      adr: "ADR-0011",
      title: "technical-writing rule",
      status: "FAIL",
      message: ".claude/rules/writing.md must declare a paths: frontmatter.",
    };
  }
  return {
    adr: "ADR-0011",
    title: "technical-writing rule",
    status: "PASS",
    message: ".claude/rules/writing.md is in place with a paths: frontmatter.",
  };
}

/**
 * Verify every adapter uses its mandated first-party reactivity primitive
 * in code, not only in prose.
 *
 * ADR-0009 fixes the primitive per framework: React subscribes through
 * `useSyncExternalStore`, Vue detaches listeners through `onScopeDispose`,
 * and Svelte holds the editor in `$state.raw` and subscribes through
 * `createSubscriber`. The import-absence check (`checkFirstPartyTiptap`)
 * proves no adapter falls back to `@tiptap/react` or `@tiptap/vue-3`; this
 * check proves the positive — each adapter actually wires its primitive.
 *
 * Each primitive name also appears in the file's JSDoc (for example, the
 * React module documents `useSyncExternalStore` at line 10). The check
 * strips comments via `stripJsComments` before scanning so a JSDoc mention
 * alone does not satisfy the requirement; only a live import or call
 * counts.
 */
function checkReactivityPrimitives(): CheckResult {
  const requirements = [
    {
      framework: "react",
      file: "packages/react/src/_reactivity.ts",
      token: "useSyncExternalStore",
    },
    {
      framework: "vue",
      file: "packages/vue/src/_reactivity.ts",
      token: "onScopeDispose",
    },
    {
      framework: "svelte",
      file: "packages/svelte/src/runes/createVizelEditor.svelte.ts",
      token: "$state.raw",
    },
    {
      framework: "svelte",
      file: "packages/svelte/src/runes/createVizelEditorState.svelte.ts",
      token: "createSubscriber",
    },
  ] as const;
  const offenders = requirements.flatMap((requirement) => {
    const source = readText(resolve(REPO_ROOT, requirement.file));
    if (source === null) {
      return [`${requirement.framework}: ${requirement.file} is missing`];
    }
    // Strip comments first so a JSDoc mention of the primitive does not
    // satisfy the check; only a live import or call counts.
    const code = stripJsComments(source);
    return code.includes(requirement.token)
      ? []
      : [`${requirement.framework}: ${requirement.file} does not use ${requirement.token} in code`];
  });
  if (offenders.length === 0) {
    return {
      adr: "ADR-0009",
      title: "first-party reactivity primitives",
      status: "PASS",
      message:
        "React uses useSyncExternalStore, Vue uses onScopeDispose, and Svelte uses $state.raw and createSubscriber in code.",
    };
  }
  return {
    adr: "ADR-0009",
    title: "first-party reactivity primitives",
    status: "FAIL",
    message: `Each adapter must wire its mandated reactivity primitive in code: ${offenders.join(", ")}`,
  };
}

const CHECKS: readonly CheckFunction[] = [
  checkPackageVersions,
  checkCrossFrameworkRuleRetired,
  checkControllerDelegation,
  () => checkComponentSize(),
  checkCssCentralisation,
  checkFirstPartyTiptap,
  checkSkillFrontmatter,
  checkWritingRule,
  checkReactivityPrimitives,
];

function emit(line: string): void {
  process.stdout.write(`${line}\n`);
}

function emitError(line: string): void {
  process.stderr.write(`${line}\n`);
}

function main(): void {
  const results: CheckResult[] = [];
  for (const check of CHECKS) {
    const outcome = check();
    if (Array.isArray(outcome)) results.push(...outcome);
    else results.push(outcome as CheckResult);
  }
  emit("ADR compliance report");
  emit("=====================");
  for (const result of results) {
    const tag = result.status.padEnd(4, " ");
    emit(`[${tag}] ${result.adr} ${result.title}`);
    emit(`        ${result.message}`);
  }
  const fail = results.filter((r) => r.status === "FAIL").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const pass = results.filter((r) => r.status === "PASS").length;
  emit("");
  emit(`Summary: ${pass} PASS, ${warn} WARN, ${fail} FAIL`);
  if (fail > 0) {
    emitError("ADR compliance harness: at least one FAIL — see report above.");
    process.exit(1);
  }
}

main();
