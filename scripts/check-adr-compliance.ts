/**
 * ADR compliance harness.
 *
 * Walks every ADR with a mechanically-checkable invariant and emits
 * PASS / WARN / FAIL per ADR. WARN indicates an in-flight Phase
 * transition; FAIL exits non-zero and blocks the build.
 *
 * Add a new ADR check by appending a function to `CHECKS` below. Each
 * function returns `{ adr, status, message }`. The harness does not
 * need a registry update.
 *
 * See ADR-0013 for the design rationale.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VIZEL_FEATURE_MANIFEST } from "../packages/core/src/feature-manifest.ts";

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
 * The cross-framework rule retires in Phase 1 per ADR-0006. The file
 * staying alive past Phase 1 is a drift signal.
 */
function checkCrossFrameworkRuleRetired(): CheckResult {
  const path = resolve(REPO_ROOT, ".claude/rules/cross-framework.md");
  if (!existsSync(path)) {
    return {
      adr: "ADR-0006",
      title: "Retire cross-framework.md",
      status: "PASS",
      message: ".claude/rules/cross-framework.md is removed.",
    };
  }
  const content = readText(path) ?? "";
  if (content.includes("DEPRECATED")) {
    return {
      adr: "ADR-0006",
      title: "Retire cross-framework.md",
      status: "WARN",
      message:
        ".claude/rules/cross-framework.md carries a deprecation header; the retirement cleanup PR removes the file.",
    };
  }
  return {
    adr: "ADR-0006",
    title: "Retire cross-framework.md",
    status: "WARN",
    message:
      ".claude/rules/cross-framework.md still on main; PR #559 lands the deprecation header and a follow-up PR removes the file. Promote to FAIL after the cleanup PR merges.",
  };
}

/**
 * Framework adapters delegate global listeners to controllers from
 * @vizel/core or @vizel/headless. Direct document/window listener
 * calls inside packages/{react,vue,svelte}/src/ are forbidden.
 */
function checkControllerDelegation(): readonly CheckResult[] {
  const results: CheckResult[] = [];
  for (const framework of ["react", "vue", "svelte"] as const) {
    const root = resolve(REPO_ROOT, "packages", framework, "src");
    const hits = grepFiles(root, /document\.addEventListener\b|window\.addEventListener\b/g, [
      ".ts",
      ".tsx",
      ".vue",
      ".svelte",
    ]);
    const total = hits.reduce((sum, hit) => sum + hit.count, 0);
    if (total === 0) {
      results.push({
        adr: "ADR-0007",
        title: `controller delegation (${framework})`,
        status: "PASS",
        message: `${framework}: zero direct document/window listeners.`,
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
      message: `${framework}: ${phase} closes the gap; ${total} listener call(s) remain. Promote to FAIL after the phase merges. Files: ${filesList}.`,
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
 * Extract the view-template block from a component source and return
 * its line count. Returns 0 when the framework has no detectable
 * template block (e.g., a TS-only file dropped into components/).
 */
function extractViewBlockLineCount(framework: "react" | "vue" | "svelte", source: string): number {
  if (framework === "react") {
    const returnMatch = source.match(/return\s*\(([\s\S]*?)\);\s*\n?\s*\}/);
    if (returnMatch === null) return 0;
    return returnMatch[1].split("\n").length;
  }
  if (framework === "vue") {
    const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
    if (templateMatch === null) return 0;
    return templateMatch[1].split("\n").length;
  }
  const scriptMatch = source.match(/<\/script>([\s\S]*)$/);
  if (scriptMatch === null) return source.split("\n").length;
  return scriptMatch[1].split("\n").length;
}

/**
 * Every adapter's exports."./styles.css" must resolve to the core
 * stylesheet. Phase 2.5 lands the integration; the harness warns
 * until then.
 */
function checkCssCentralisation(): CheckResult {
  const offenders: string[] = [];
  for (const framework of ["react", "vue", "svelte"] as const) {
    const manifest = readText(resolve(REPO_ROOT, "packages", framework, "package.json"));
    if (manifest === null) continue;
    const match = manifest.match(/"\.\/styles\.css":\s*"([^"]+)"/);
    if (match === null) {
      offenders.push(`${framework}: missing exports."./styles.css"`);
      continue;
    }
    const target = match[1];
    if (!target.includes("@vizel/core")) {
      offenders.push(`${framework}: ${target}`);
    }
  }
  if (offenders.length === 0) {
    return {
      adr: "ADR-0008",
      title: "CSS centralisation",
      status: "PASS",
      message: "Every adapter resolves styles.css to @vizel/core.",
    };
  }
  return {
    adr: "ADR-0008",
    title: "CSS centralisation",
    status: "WARN",
    message: `Phase 2.5 will redirect each adapter's exports."./styles.css" to @vizel/core. Pending: ${offenders.join(", ")}`,
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
 * Every skill carries description and when_to_use frontmatter. Path-
 * scoped skills also carry a `paths:` field. ADR-0010 documents the
 * official Claude Code spec.
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
    if (!source.includes("description:")) offenders.push(`${skill}: missing description`);
    if (!source.includes("when_to_use:")) offenders.push(`${skill}: missing when_to_use`);
  }
  if (offenders.length === 0) {
    return {
      adr: "ADR-0010",
      title: ".claude/ official format (skills)",
      status: "PASS",
      message: "Every skill carries description and when_to_use frontmatter.",
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
 * Every feature in VIZEL_FEATURE_MANIFEST owns a scenario folder
 * under tests/ct/scenarios/v2/<feature-id>/index.ts.
 */
function checkScenarioFolders(): CheckResult {
  const missing: string[] = [];
  for (const feature of VIZEL_FEATURE_MANIFEST) {
    const scenarioPath = resolve(REPO_ROOT, "tests/ct/scenarios/v2", feature.id, "index.ts");
    if (!existsSync(scenarioPath)) missing.push(feature.id);
  }
  if (missing.length === 0) {
    return {
      adr: "ADR-0012",
      title: "Playwright CT three-layer (scenario folders)",
      status: "PASS",
      message: `Every manifest feature has a v2 scenario folder (${VIZEL_FEATURE_MANIFEST.length} features).`,
    };
  }
  return {
    adr: "ADR-0012",
    title: "Playwright CT three-layer (scenario folders)",
    status: "FAIL",
    message: `Missing scenario folders: ${missing.join(", ")}`,
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
  checkScenarioFolders,
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
