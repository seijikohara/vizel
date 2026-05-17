/**
 * Cross-framework parity check.
 *
 * Verifies that `@vizel/react`, `@vizel/vue`, and `@vizel/svelte` expose
 * the same public surface from their respective `src/index.ts` files,
 * modulo the idiom exceptions cataloged below.
 *
 * Checks performed:
 *
 * 1. Identifier parity — every "stem" present in at least one framework
 *    must appear in all three, where the stem is the symbol name with the
 *    framework's idiom prefix (`use*` for React and Vue; `create*` or
 *    `get*` for Svelte) stripped.
 * 2. Core re-export stub — confirms that each framework `src/index.ts`
 *    eventually grows an `export * from "@vizel/core"` line (Section 6
 *    enforces this fully; for 5b we only emit a notice).
 * 3. Idiom exception whitelist — Category B exceptions from the
 *    cross-framework parity spec are recognized and never reported.
 *
 * Exits with code 0 on success, 1 on any parity violation.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// =============================================================================
// Configuration
// =============================================================================

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

interface FrameworkConfig {
  name: "react" | "vue" | "svelte";
  indexPath: string;
  /**
   * Idiom prefixes recognized for value symbols. Stripped from a
   * symbol name to derive its parity stem.
   */
  valuePrefixes: readonly string[];
  /**
   * Idiom prefixes recognized for type symbols. Types follow the same
   * verb idiom as their associated function, but in PascalCase
   * (`UseVizelAutoSaveResult`, `CreateVizelAutoSaveResult`).
   */
  typePrefixes: readonly string[];
}

const FRAMEWORKS: readonly FrameworkConfig[] = [
  {
    name: "react",
    indexPath: resolve(REPO_ROOT, "packages/react/src/index.ts"),
    // `create*` is shared by React/Vue/Svelte for factory functions that
    // do not follow the `use*` hook idiom (e.g. `createVizelSlashMenuRenderer`).
    valuePrefixes: ["use", "create"],
    typePrefixes: ["Use", "Create"],
  },
  {
    name: "vue",
    indexPath: resolve(REPO_ROOT, "packages/vue/src/index.ts"),
    valuePrefixes: ["use", "create", "provide"],
    typePrefixes: ["Use", "Create"],
  },
  {
    name: "svelte",
    indexPath: resolve(REPO_ROOT, "packages/svelte/src/index.ts"),
    valuePrefixes: ["create", "get"],
    typePrefixes: ["Create"],
  },
];

/**
 * Idiom exception catalog (Category B from
 * `docs/superpowers/specs/2026-05-16-vizel-v2-ideal-interface-design.md`
 * Section 5).
 *
 * Each entry lists the symbol per framework (or `null` when the symbol
 * is intentionally absent in that framework). When all three frameworks
 * are non-null, the entry pins the exact idiom triple. When one or more
 * are null, the entry is a sanctioned single-framework or paired
 * exception (e.g. Vue's `provideVizelIcons` has no React or Svelte
 * counterpart by design).
 *
 * Stems built from these entries are excluded from the identifier
 * parity check; missing-in-one-framework entries (with `null`) are
 * never reported as defects.
 */
interface IdiomException {
  /** Human-readable stem used in error messages. */
  stem: string;
  react: string | null;
  vue: string | null;
  svelte: string | null;
}

const IDIOM_EXCEPTIONS: readonly IdiomException[] = [
  // Category B row 1 — function prefix (`useFoo` vs `createFoo`).
  {
    stem: "VizelEditor",
    react: "useVizelEditor",
    vue: "useVizelEditor",
    svelte: "createVizelEditor",
  },
  { stem: "VizelState", react: "useVizelState", vue: "useVizelState", svelte: "createVizelState" },
  {
    stem: "VizelEditorState",
    react: "useVizelEditorState",
    vue: "useVizelEditorState",
    svelte: "createVizelEditorState",
  },
  {
    stem: "VizelAutoSave",
    react: "useVizelAutoSave",
    vue: "useVizelAutoSave",
    svelte: "createVizelAutoSave",
  },
  {
    stem: "VizelMarkdown",
    react: "useVizelMarkdown",
    vue: "useVizelMarkdown",
    svelte: "createVizelMarkdown",
  },
  {
    stem: "VizelCollaboration",
    react: "useVizelCollaboration",
    vue: "useVizelCollaboration",
    svelte: "createVizelCollaboration",
  },
  {
    stem: "VizelComment",
    react: "useVizelComment",
    vue: "useVizelComment",
    svelte: "createVizelComment",
  },
  {
    stem: "VizelVersionHistory",
    react: "useVizelVersionHistory",
    vue: "useVizelVersionHistory",
    svelte: "createVizelVersionHistory",
  },
  // Category B row 2 — context getter prefix (`useVizelContext` vs `getVizelContext`).
  {
    stem: "VizelContext",
    react: "useVizelContext",
    vue: "useVizelContext",
    svelte: "getVizelContext",
  },
  {
    stem: "VizelContextSafe",
    react: "useVizelContextSafe",
    vue: "useVizelContextSafe",
    svelte: "getVizelContextSafe",
  },
  {
    stem: "VizelIconContext",
    react: "useVizelIconContext",
    vue: "useVizelIconContext",
    svelte: "getVizelIconContext",
  },
  { stem: "VizelTheme", react: "useVizelTheme", vue: "useVizelTheme", svelte: "getVizelTheme" },
  {
    stem: "VizelThemeSafe",
    react: "useVizelThemeSafe",
    vue: "useVizelThemeSafe",
    svelte: "getVizelThemeSafe",
  },
  // Vue-only idiomatic helper: `provide*` composable backing `VizelIconProvider`.
  // React and Svelte expose the same capability through `VizelIconProvider` only.
  { stem: "VizelIcons", react: null, vue: "provideVizelIcons", svelte: null },
];

// Stem-to-exception index for O(1) lookups.
const EXCEPTION_BY_STEM = new Map<string, IdiomException>(
  IDIOM_EXCEPTIONS.map((entry) => [entry.stem, entry])
);

// =============================================================================
// Symbol extraction (TypeScript Compiler API)
// =============================================================================

interface FrameworkExports {
  framework: FrameworkConfig["name"];
  /** Value exports (functions, components, constants). */
  values: ReadonlySet<string>;
  /** Type-only exports (interfaces, type aliases). */
  types: ReadonlySet<string>;
  /** Raw source text for substring checks (e.g. `export * from`). */
  source: string;
}

function collectExports(config: FrameworkConfig): FrameworkExports {
  const source = readFileSync(config.indexPath, "utf8");
  const sourceFile = ts.createSourceFile(
    config.indexPath,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS
  );

  const values = new Set<string>();
  const types = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      const declarationIsTypeOnly = node.isTypeOnly === true;
      for (const element of node.exportClause.elements) {
        const name = element.name.text;
        const elementIsTypeOnly = element.isTypeOnly === true;
        if (declarationIsTypeOnly || elementIsTypeOnly) {
          types.add(name);
        } else {
          values.add(name);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    framework: config.name,
    values,
    types,
    source,
  };
}

// =============================================================================
// Stem derivation
// =============================================================================

/**
 * Strip the framework's idiom prefix from a symbol name and return the
 * stem. Returns `null` when no recognized prefix applies, signaling
 * that the symbol's name itself is the stem (e.g. component classes
 * `Vizel*`, type aliases, constants).
 */
function stripIdiomPrefix(name: string, prefixes: readonly string[]): string | null {
  for (const prefix of prefixes) {
    // The prefix must be followed by an uppercase letter to avoid
    // false positives like `userVizelX` matching `use`.
    if (name.startsWith(prefix) && name.length > prefix.length) {
      const firstChar = name.charAt(prefix.length);
      if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
        return name.slice(prefix.length);
      }
    }
  }
  return null;
}

/**
 * Bucket each export into either a stemmed identifier (when a prefix
 * strips cleanly) or the literal name (no recognized prefix). The
 * first bucket is used for cross-framework parity comparisons; the
 * second is compared verbatim across the three frameworks.
 */
function categorizeExports(
  exportsByFramework: ReadonlyMap<FrameworkConfig["name"], FrameworkExports>
): {
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>;
  literalsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlySet<string>>;
} {
  const stemsByFramework = new Map<FrameworkConfig["name"], Map<string, string>>();
  const literalsByFramework = new Map<FrameworkConfig["name"], Set<string>>();

  for (const config of FRAMEWORKS) {
    const exportsForFw = exportsByFramework.get(config.name);
    if (!exportsForFw) continue;

    const stems = new Map<string, string>();
    const literals = new Set<string>();

    for (const value of exportsForFw.values) {
      const stem = stripIdiomPrefix(value, config.valuePrefixes);
      if (stem === null) {
        literals.add(value);
      } else {
        stems.set(stem, value);
      }
    }
    for (const type of exportsForFw.types) {
      const stem = stripIdiomPrefix(type, config.typePrefixes);
      if (stem === null) {
        literals.add(type);
      } else {
        // Type stems are namespaced with a `T:` prefix so they do not
        // collide with value stems (e.g. the function `useVizelMarkdown`
        // and the type `UseVizelMarkdownResult` both contribute
        // `VizelMarkdown` after prefix stripping, but they are
        // distinct symbols).
        stems.set(`T:${stem}`, type);
      }
    }

    stemsByFramework.set(config.name, stems);
    literalsByFramework.set(config.name, literals);
  }

  return { stemsByFramework, literalsByFramework };
}

// =============================================================================
// Parity checks
// =============================================================================

interface Violation {
  category: "identifier" | "literal" | "core-reexport";
  message: string;
}

/** Compute the set of frameworks that lack `stem`, honoring `null` exception slots. */
function findFrameworksMissingStem(
  stem: string,
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>,
  exception: IdiomException | undefined
): FrameworkConfig["name"][] {
  const missing: FrameworkConfig["name"][] = [];
  for (const config of FRAMEWORKS) {
    const hasStem = stemsByFramework.get(config.name)?.has(stem) ?? false;
    if (hasStem) continue;
    // If the exception explicitly marks this framework as null, the
    // symbol is intentionally absent.
    const exceptionDeclaresAbsent = exception?.[config.name] === null;
    if (exceptionDeclaresAbsent) continue;
    missing.push(config.name);
  }
  return missing;
}

/** Format a single identifier-parity violation message for a missing stem. */
function formatIdentifierViolation(
  stem: string,
  missing: readonly FrameworkConfig["name"][],
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>
): Violation {
  const isTypeStem = stem.startsWith("T:");
  const displayStem = isTypeStem ? stem.slice(2) : stem;
  const placeholder = (verb: string): string => `(${verb}${displayStem})`;
  const reactSymbol =
    stemsByFramework.get("react")?.get(stem) ?? placeholder(isTypeStem ? "Use" : "use");
  const vueSymbol =
    stemsByFramework.get("vue")?.get(stem) ?? placeholder(isTypeStem ? "Use" : "use");
  const svelteSymbol =
    stemsByFramework.get("svelte")?.get(stem) ?? placeholder(isTypeStem ? "Create" : "create");
  const label = isTypeStem ? `type stem "${displayStem}"` : `stem "${displayStem}"`;
  return {
    category: "identifier",
    message: `${label} missing from ${missing.join(", ")} (react: ${reactSymbol}, vue: ${vueSymbol}, svelte: ${svelteSymbol})`,
  };
}

function checkIdentifierParity(
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>
): Violation[] {
  const allStems = new Set<string>();
  for (const stems of stemsByFramework.values()) {
    for (const stem of stems.keys()) allStems.add(stem);
  }

  const violations: Violation[] = [];
  for (const stem of allStems) {
    const exception = EXCEPTION_BY_STEM.get(stem);
    const missing = findFrameworksMissingStem(stem, stemsByFramework, exception);
    if (missing.length > 0) {
      violations.push(formatIdentifierViolation(stem, missing, stemsByFramework));
    }
  }
  return violations;
}

function checkLiteralParity(
  literalsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlySet<string>>
): Violation[] {
  const violations: Violation[] = [];
  const allLiterals = new Set<string>();
  for (const literals of literalsByFramework.values()) {
    for (const literal of literals) {
      allLiterals.add(literal);
    }
  }

  for (const literal of allLiterals) {
    const missing: FrameworkConfig["name"][] = [];
    for (const config of FRAMEWORKS) {
      const literals = literalsByFramework.get(config.name);
      if (!literals?.has(literal)) {
        missing.push(config.name);
      }
    }
    if (missing.length > 0) {
      violations.push({
        category: "literal",
        message: `symbol "${literal}" missing from ${missing.join(", ")}`,
      });
    }
  }

  return violations;
}

function checkCoreReexportStub(
  exportsByFramework: ReadonlyMap<FrameworkConfig["name"], FrameworkExports>
): Violation[] {
  // Section 6 fully enforces `export * from "@vizel/core"`. For 5b this
  // is an advisory check — we only emit a notice if the line is absent.
  // No violations are produced.
  const violations: Violation[] = [];
  const pattern = /export\s*\*\s*from\s*["']@vizel\/core["']/;
  for (const config of FRAMEWORKS) {
    const exports = exportsByFramework.get(config.name);
    if (!exports) continue;
    if (!pattern.test(exports.source)) {
      // Emit as a console notice so it shows up in CI logs without
      // failing the run. Section 6 will upgrade this to a violation.
      console.log(
        `note: ${config.name}/src/index.ts does not yet contain \`export * from "@vizel/core"\` (will be enforced in Section 6).`
      );
    }
  }
  return violations;
}

// =============================================================================
// Main
// =============================================================================

function main(): number {
  const exportsByFramework = new Map<FrameworkConfig["name"], FrameworkExports>();
  for (const config of FRAMEWORKS) {
    exportsByFramework.set(config.name, collectExports(config));
  }

  const { stemsByFramework, literalsByFramework } = categorizeExports(exportsByFramework);

  const violations: Violation[] = [
    ...checkIdentifierParity(stemsByFramework),
    ...checkLiteralParity(literalsByFramework),
    ...checkCoreReexportStub(exportsByFramework),
  ];

  if (violations.length === 0) {
    console.log("Cross-framework parity check passed.");
    return 0;
  }

  console.error(`Cross-framework parity check failed with ${violations.length} violation(s):`);
  for (const violation of violations) {
    console.error(`  [${violation.category}] ${violation.message}`);
  }
  return 1;
}

process.exit(main());
