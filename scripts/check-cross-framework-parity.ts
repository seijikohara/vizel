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
 *    must appear in all three (idiom prefixes `use*` / `create*` / `get*`
 *    stripped before comparison).
 * 2. Core re-export — each framework `src/index.ts` must include
 *    `export * from "@vizel/core"` (Section 6 of the v2.0.0 spec).
 * 3. Core symbol reachability — every symbol exported from
 *    `packages/core/src/index.ts` must remain reachable through each
 *    framework's public surface. The wildcard re-export from check 2
 *    forwards every Core symbol by default, so this sub-check guards
 *    against accidental shadowing by same-named non-Core re-exports.
 * 4. Idiom exception whitelist — Category B exceptions from the
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
const CORE_INDEX_PATH = resolve(REPO_ROOT, "packages/core/src/index.ts");

interface FrameworkConfig {
  name: "react" | "vue" | "svelte";
  indexPath: string;
  /** Idiom prefixes stripped from value names to derive parity stems. */
  valuePrefixes: readonly string[];
  /** PascalCase counterparts of `valuePrefixes` for type names. */
  typePrefixes: readonly string[];
}

// `create*` is shared across frameworks for factory functions outside
// the hook idiom (e.g. `createVizelSlashMenuRenderer`).
const FRAMEWORKS: readonly FrameworkConfig[] = [
  {
    name: "react",
    indexPath: resolve(REPO_ROOT, "packages/react/src/index.ts"),
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
 * Section 5). Each entry pins the per-framework symbol triple, with
 * `null` marking sanctioned absences (e.g. Vue-only `provideVizelIcons`).
 * Stems built from these entries are excluded from the identifier
 * parity check.
 */
interface IdiomException {
  stem: string;
  react: string | null;
  vue: string | null;
  svelte: string | null;
}

// Build an exception entry from a stem and the Svelte prefix (React and
// Vue always share `use`). Vue-only `provideVizelIcons` backs
// `VizelIconProvider`; React and Svelte expose it through the component.
const idiomEntry = (stem: string, sveltePrefix: "create" | "get"): IdiomException => ({
  stem,
  react: `use${stem}`,
  vue: `use${stem}`,
  svelte: `${sveltePrefix}${stem}`,
});
const IDIOM_EXCEPTIONS: readonly IdiomException[] = [
  // Category B row 1 — function prefix (`useFoo` vs `createFoo`).
  idiomEntry("VizelEditor", "create"),
  idiomEntry("VizelState", "create"),
  idiomEntry("VizelEditorState", "create"),
  idiomEntry("VizelAutoSave", "create"),
  idiomEntry("VizelMarkdown", "create"),
  idiomEntry("VizelCollaboration", "create"),
  idiomEntry("VizelComment", "create"),
  idiomEntry("VizelVersionHistory", "create"),
  // Category B row 2 — context getter prefix (`useVizelContext` vs `getVizelContext`).
  idiomEntry("VizelContext", "get"),
  idiomEntry("VizelContextSafe", "get"),
  idiomEntry("VizelIconContext", "get"),
  idiomEntry("VizelTheme", "get"),
  idiomEntry("VizelThemeSafe", "get"),
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
  /**
   * Every explicit named export keyed by name; value is the module
   * specifier it was re-exported from, or `null` for a bare
   * `export { foo }` without `from`.
   */
  namedExportSources: ReadonlyMap<string, string | null>;
  /** Module specifiers re-exported via `export * from "X"`. */
  wildcardSources: ReadonlySet<string>;
}

function collectExports(indexPath: string, framework: FrameworkConfig["name"]): FrameworkExports {
  const sourceFile = ts.createSourceFile(
    indexPath,
    readFileSync(indexPath, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS
  );

  const values = new Set<string>();
  const types = new Set<string>();
  const namedExportSources = new Map<string, string | null>();
  const wildcardSources = new Set<string>();

  function handleExportDeclaration(node: ts.ExportDeclaration): void {
    const moduleSpecifier =
      node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : null;
    if (!node.exportClause && moduleSpecifier !== null) {
      wildcardSources.add(moduleSpecifier);
      return;
    }
    if (!(node.exportClause && ts.isNamedExports(node.exportClause))) return;
    const declarationIsTypeOnly = node.isTypeOnly === true;
    for (const element of node.exportClause.elements) {
      const name = element.name.text;
      if (declarationIsTypeOnly || element.isTypeOnly === true) types.add(name);
      else values.add(name);
      namedExportSources.set(name, moduleSpecifier);
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isExportDeclaration(node)) handleExportDeclaration(node);
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { framework, values, types, namedExportSources, wildcardSources };
}

// =============================================================================
// Stem derivation
// =============================================================================

/**
 * Strip the framework's idiom prefix from a symbol name and return the
 * stem. Returns `null` when no recognized prefix applies (e.g. component
 * classes, type aliases, constants — the literal name is the stem).
 */
function stripIdiomPrefix(name: string, prefixes: readonly string[]): string | null {
  for (const prefix of prefixes) {
    if (!name.startsWith(prefix) || name.length <= prefix.length) continue;
    // The next character must be uppercase to avoid false positives
    // like `userVizelX` matching `use`.
    const next = name.charAt(prefix.length);
    if (next === next.toUpperCase() && next !== next.toLowerCase()) {
      return name.slice(prefix.length);
    }
  }
  return null;
}

/**
 * Bucket each export into a stemmed identifier (prefix strips cleanly)
 * or a literal name (no recognized prefix). Stems are compared modulo
 * idiom prefix; literals are compared verbatim across frameworks.
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
      if (stem === null) literals.add(value);
      else stems.set(stem, value);
    }
    for (const type of exportsForFw.types) {
      const stem = stripIdiomPrefix(type, config.typePrefixes);
      if (stem === null) literals.add(type);
      // `T:` prefix prevents collisions with same-stem value symbols
      // (e.g. `useVizelMarkdown` vs `UseVizelMarkdownResult`).
      else stems.set(`T:${stem}`, type);
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
  category: "identifier" | "literal" | "core-reexport" | "core-reachability";
  message: string;
}

/** Frameworks lacking `stem`, honoring `null` exception slots. */
function findFrameworksMissingStem(
  stem: string,
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>,
  exception: IdiomException | undefined
): FrameworkConfig["name"][] {
  const missing: FrameworkConfig["name"][] = [];
  for (const config of FRAMEWORKS) {
    if (stemsByFramework.get(config.name)?.has(stem)) continue;
    if (exception?.[config.name] === null) continue;
    missing.push(config.name);
  }
  return missing;
}

function formatIdentifierViolation(
  stem: string,
  missing: readonly FrameworkConfig["name"][],
  stemsByFramework: ReadonlyMap<FrameworkConfig["name"], ReadonlyMap<string, string>>
): Violation {
  const isTypeStem = stem.startsWith("T:");
  const displayStem = isTypeStem ? stem.slice(2) : stem;
  const placeholder = (verb: string): string => `(${verb}${displayStem})`;
  const get = (fw: FrameworkConfig["name"], fallback: string): string =>
    stemsByFramework.get(fw)?.get(stem) ?? placeholder(fallback);
  const reactSymbol = get("react", isTypeStem ? "Use" : "use");
  const vueSymbol = get("vue", isTypeStem ? "Use" : "use");
  const svelteSymbol = get("svelte", isTypeStem ? "Create" : "create");
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
    for (const literal of literals) allLiterals.add(literal);
  }
  for (const literal of allLiterals) {
    const missing: FrameworkConfig["name"][] = [];
    for (const config of FRAMEWORKS) {
      if (!literalsByFramework.get(config.name)?.has(literal)) missing.push(config.name);
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

function checkCoreReexport(
  exportsByFramework: ReadonlyMap<FrameworkConfig["name"], FrameworkExports>
): Violation[] {
  // Section 6 of the v2.0.0 spec requires every framework package to
  // re-export the full `@vizel/core` surface so consumers can install
  // one framework package and import every shared symbol from it.
  const violations: Violation[] = [];
  for (const config of FRAMEWORKS) {
    const exports = exportsByFramework.get(config.name);
    if (exports && !exports.wildcardSources.has("@vizel/core")) {
      violations.push({
        category: "core-reexport",
        message: `${config.name} package missing \`export * from "@vizel/core"\` — required by Section 6 of the v2.0.0 spec`,
      });
    }
  }
  return violations;
}

// =============================================================================
// Core symbol reachability
// =============================================================================

/**
 * Collect every named export from `@vizel/core/src/index.ts`. Names
 * starting with `_` are skipped (implementation-private aliases).
 */
function collectCoreSymbols(): ReadonlySet<string> {
  const exports = collectExports(CORE_INDEX_PATH, "react");
  const symbols = new Set<string>();
  for (const name of [...exports.values, ...exports.types]) {
    if (!name.startsWith("_")) symbols.add(name);
  }
  return symbols;
}

/**
 * Resolve a relative import to its on-disk path. The Svelte package
 * uses `.js` import strings that resolve to `.ts` / `.svelte.ts` files.
 */
function resolveRelativeModule(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const importerDir = dirname(importerPath);
  for (const candidate of [
    specifier,
    specifier.replace(/\.js$/, ".ts"),
    specifier.replace(/\.js$/, ".svelte.ts"),
  ]) {
    try {
      const absolute = resolve(importerDir, candidate);
      readFileSync(absolute, "utf8");
      return absolute;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

/**
 * Walk a module and return, per exported name, the module specifier
 * the symbol came from (`null` for a local declaration).
 */
function collectModuleReexports(filePath: string): ReadonlyMap<string, string | null> {
  const sourceFile = ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS
  );
  const importedFrom = new Map<string, string>();
  const reexports = new Map<string, string | null>();

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      for (const element of node.importClause.namedBindings.elements) {
        importedFrom.set(element.name.text, specifier);
      }
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      const from =
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
          ? node.moduleSpecifier.text
          : null;
      // Bare `export { Foo }` resolves to the matching `import { Foo }`
      // (or to a local declaration when no import exists).
      for (const element of node.exportClause.elements) {
        const name = element.name.text;
        reexports.set(name, from ?? importedFrom.get(name) ?? null);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return reexports;
}

/**
 * Trace a same-named export through framework-local modules to confirm
 * it ultimately originates in `@vizel/core`. Cross-name renames cannot
 * satisfy same-name reachability, so the walk only follows the same name.
 */
function tracesToCore(
  startFile: string,
  startSpecifier: string,
  symbol: string,
  visited: Set<string> = new Set()
): boolean {
  if (startSpecifier === "@vizel/core") return true;
  if (!startSpecifier.startsWith(".")) return false;
  const resolved = resolveRelativeModule(startFile, startSpecifier);
  if (resolved === null || visited.has(resolved) || visited.size > 16) return false;
  visited.add(resolved);
  const next = collectModuleReexports(resolved).get(symbol);
  if (next === undefined || next === null) return false;
  return tracesToCore(resolved, next, symbol, visited);
}

/**
 * `export * from "@vizel/core"` forwards every Core symbol by default;
 * a same-named explicit export from a framework-local module overrides
 * the wildcard. The override is safe only when the local re-export
 * resolves back to the same Core symbol.
 */
function checkCoreSymbolReachability(
  coreSymbols: ReadonlySet<string>,
  exportsByFramework: ReadonlyMap<FrameworkConfig["name"], FrameworkExports>
): Violation[] {
  const violations: Violation[] = [];
  for (const config of FRAMEWORKS) {
    const exports = exportsByFramework.get(config.name);
    if (!exports) continue;
    for (const symbol of coreSymbols) {
      const overrideSource = exports.namedExportSources.get(symbol);
      if (overrideSource === undefined) continue;
      if (overrideSource === null || overrideSource === "@vizel/core") continue;
      if (tracesToCore(config.indexPath, overrideSource, symbol)) continue;
      violations.push({
        category: "core-reachability",
        message: `${config.name} shadows Core symbol "${symbol}" with an explicit export from "${overrideSource}" — remove the explicit export or rename it to keep the @vizel/core symbol reachable`,
      });
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
    exportsByFramework.set(config.name, collectExports(config.indexPath, config.name));
  }

  const coreSymbols = collectCoreSymbols();

  const { stemsByFramework, literalsByFramework } = categorizeExports(exportsByFramework);

  const violations: Violation[] = [
    ...checkIdentifierParity(stemsByFramework),
    ...checkLiteralParity(literalsByFramework),
    ...checkCoreReexport(exportsByFramework),
    ...checkCoreSymbolReachability(coreSymbols, exportsByFramework),
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
