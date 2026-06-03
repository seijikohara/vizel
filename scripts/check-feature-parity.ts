/**
 * Feature manifest parity check.
 *
 * The check asserts that every adapter (`@vizel/react`, `@vizel/vue`,
 * `@vizel/svelte`) exports the `component` and `companion` symbols the
 * feature manifest declares for each feature. The manifest in
 * `packages/core/src/feature-manifest.ts` is the parity SSOT; see
 * ADR-0002 and `.claude/rules/feature-manifest.md`.
 *
 * Mechanism — static export-surface resolution (build-independent):
 *
 * 1. The check parses each adapter's `src/index.ts` with the TypeScript
 *    compiler API and computes its EFFECTIVE export set. The effective
 *    set is the union of the adapter's own explicitly named exports and
 *    the public export surface of `@vizel/core`, which every adapter
 *    forwards through the mandatory `export * from "@vizel/core"`.
 * 2. The check resolves the Core surface by recursively walking the
 *    `export { ... } from "./x"`, `export type { ... }`, and
 *    `export * from "./x"` declarations rooted at
 *    `packages/core/src/index.ts`, following relative re-export targets
 *    until every forwarded name is enumerated.
 * 3. A manifest-declared symbol is PRESENT when it appears in an
 *    adapter's effective set, and MISSING otherwise. Adapter components
 *    such as `VizelEditor` live in the adapter, never in Core, so the
 *    check fails the moment any adapter drops a declared component or
 *    companion symbol. Per-framework-only extras (Svelte
 *    `getVizelTheme`, React `use*`) never false-fail because the check
 *    only asserts that the manifest-declared symbols exist.
 *
 * The check reads source files only; it never imports built artefacts.
 * The earlier implementation accepted any symbol whenever the adapter
 * re-exported `@vizel/core`, which silenced every regression because
 * the wildcard re-export is mandatory. This version enumerates the
 * forwarded names instead, so a dropped symbol surfaces as a failure.
 *
 * `verifyManifestStructure` keeps the unique-id invariant that the type
 * system cannot express.
 *
 * Exits 0 on success, 1 on any divergence.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  VIZEL_FEATURE_MANIFEST,
  type VizelFeatureAdapters,
  type VizelFeatureDefinition,
} from "../packages/core/src/feature-manifest.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const CORE_INDEX = resolve(REPO_ROOT, "packages/core/src/index.ts");

interface AdapterPaths {
  readonly framework: keyof VizelFeatureAdapters;
  readonly indexPath: string;
}

const ADAPTERS: readonly AdapterPaths[] = [
  { framework: "react", indexPath: resolve(REPO_ROOT, "packages/react/src/index.ts") },
  { framework: "vue", indexPath: resolve(REPO_ROOT, "packages/vue/src/index.ts") },
  { framework: "svelte", indexPath: resolve(REPO_ROOT, "packages/svelte/src/index.ts") },
];

const CORE_SPECIFIER = "@vizel/core";

interface ParityFinding {
  readonly featureId: string;
  readonly framework: keyof VizelFeatureAdapters;
  readonly missing: readonly string[];
}

/**
 * Verify the manifest itself: every feature ID is unique. The TypeScript
 * compiler enforces structural correctness; this check guards the one
 * invariant the type system cannot express.
 */
function verifyManifestStructure(manifest: readonly VizelFeatureDefinition[]): readonly string[] {
  const seen = new Set<string>();
  return manifest.flatMap((feature) => {
    const duplicate = seen.has(feature.id);
    seen.add(feature.id);
    return duplicate ? [`Duplicate feature id: ${feature.id}`] : [];
  });
}

/** Parse a source file into a TypeScript AST without type checking. */
function parseSourceFile(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS
  );
}

/**
 * Resolve a relative module specifier to a source file on disk. The
 * specifiers in this repository carry an explicit `.ts` extension; the
 * resolver also tries `index.ts` for directory targets so future
 * `./dir` re-exports keep resolving.
 */
function resolveRelativeModule(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, resolve(base, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

interface ModuleExports {
  /** Names this module exports under its own surface. */
  readonly names: ReadonlySet<string>;
  /** Whether the module re-exports the full `@vizel/core` surface. */
  readonly reexportsCore: boolean;
}

/**
 * Return the binding names a node declares with the `export` modifier.
 * Covers named declarations (`export function f`, `export const c`,
 * `export class C`, `export interface I`, `export type T`, `export enum
 * E`). A node without the `export` modifier contributes nothing.
 */
function collectDeclaredExportNames(node: ts.Statement): readonly string[] {
  const exported = ts.canHaveModifiers(node)
    ? ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    : false;
  if (!exported) return [];
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
    return node.name ? [node.name.text] : [];
  }
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    return [node.name.text];
  }
  if (ts.isEnumDeclaration(node)) {
    return [node.name.text];
  }
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations.flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [declaration.name.text] : []
    );
  }
  return [];
}

/** Return an export declaration's string module specifier, or null. */
function moduleSpecifierText(node: ts.ExportDeclaration): string | null {
  return node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : null;
}

/**
 * Return the names a single `export` declaration exposes. Named clauses
 * (`export { a, b as c } [from "..."]`) expose the listed names; a
 * relative `export * from "./x"` forwards every name in the target, which
 * `recurse` resolves. Bare `export * from "pkg"` contributes nothing — its
 * surface is external and the adapter check treats `@vizel/core` apart.
 */
function collectExportDeclarationNames(
  node: ts.ExportDeclaration,
  fromFile: string,
  recurse: (target: string) => ReadonlySet<string>
): readonly string[] {
  if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    return node.exportClause.elements.map((element) => element.name.text);
  }
  const specifier = moduleSpecifierText(node);
  if (!node.exportClause && specifier && specifier.startsWith(".")) {
    const target = resolveRelativeModule(fromFile, specifier);
    return target ? [...recurse(target)] : [];
  }
  return [];
}

/**
 * Return the names a single statement contributes to its module's export
 * surface, delegating relative wildcard re-exports to `recurse`.
 */
function collectStatementExportNames(
  statement: ts.Statement,
  fromFile: string,
  recurse: (target: string) => ReadonlySet<string>
): readonly string[] {
  const declared = collectDeclaredExportNames(statement);
  const reexported = ts.isExportDeclaration(statement)
    ? collectExportDeclarationNames(statement, fromFile, recurse)
    : [];
  return [...declared, ...reexported];
}

/**
 * Compute the public export surface of a module file. The function
 * recurses through relative `export * from "./x"` and
 * `export { ... } from "./x"` targets so the returned set contains every
 * forwarded name. The `visited` set guards against re-export cycles.
 */
function resolveModuleExports(filePath: string, visited: Set<string>): ReadonlySet<string> {
  if (visited.has(filePath)) return new Set<string>();
  visited.add(filePath);
  const recurse = (target: string): ReadonlySet<string> => resolveModuleExports(target, visited);
  const names = parseSourceFile(filePath).statements.flatMap((statement) =>
    collectStatementExportNames(statement, filePath, recurse)
  );
  return new Set<string>(names);
}

/** Return whether a statement is `export * from "@vizel/core"`. */
function reexportsCoreSurface(statement: ts.Statement): boolean {
  return (
    ts.isExportDeclaration(statement) &&
    !statement.exportClause &&
    moduleSpecifierText(statement) === CORE_SPECIFIER
  );
}

/**
 * Compute an adapter's effective export set. The set is the union of the
 * adapter's own export surface and the `@vizel/core` surface, which the
 * adapter forwards through the mandatory `export * from "@vizel/core"`.
 */
function loadAdapterSurface(indexPath: string, coreSurface: ReadonlySet<string>): ModuleExports {
  const statements = parseSourceFile(indexPath).statements;
  const reexportsCore = statements.some(reexportsCoreSurface);
  const recurse = (target: string): ReadonlySet<string> =>
    resolveModuleExports(target, new Set<string>());
  const ownNames = statements.flatMap((statement) =>
    collectStatementExportNames(statement, indexPath, recurse)
  );
  const names = new Set<string>(ownNames);
  if (reexportsCore) {
    for (const name of coreSurface) names.add(name);
  }
  return { names, reexportsCore };
}

/**
 * Verify a single adapter against the manifest. Return a finding when the
 * adapter's effective export set omits a declared component or companion
 * symbol.
 */
function verifyAdapter(
  manifest: readonly VizelFeatureDefinition[],
  adapter: AdapterPaths,
  coreSurface: ReadonlySet<string>
): readonly ParityFinding[] {
  const surface = loadAdapterSurface(adapter.indexPath, coreSurface);
  return manifest.flatMap((feature) => {
    const adapterShape = feature.adapters[adapter.framework];
    const declared = [adapterShape.component, adapterShape.companion].filter(
      (symbol): symbol is string => typeof symbol === "string"
    );
    const missing = declared.filter((symbol) => !surface.names.has(symbol));
    return missing.length > 0
      ? [{ featureId: feature.id, framework: adapter.framework, missing }]
      : [];
  });
}

function main(): void {
  const structuralErrors = verifyManifestStructure(VIZEL_FEATURE_MANIFEST);
  if (structuralErrors.length > 0) {
    console.error("Manifest structure errors:");
    for (const error of structuralErrors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const coreSurface = resolveModuleExports(CORE_INDEX, new Set<string>());
  const allFindings = ADAPTERS.flatMap((adapter) =>
    verifyAdapter(VIZEL_FEATURE_MANIFEST, adapter, coreSurface)
  );

  if (allFindings.length === 0) {
    const featureCount = VIZEL_FEATURE_MANIFEST.length;
    console.log(`Feature manifest parity check passed (${featureCount} features × 3 frameworks).`);
    return;
  }

  console.error("Feature manifest parity violations:");
  for (const finding of allFindings) {
    console.error(
      `  - ${finding.featureId} / ${finding.framework}: missing ${finding.missing.join(", ")}`
    );
  }
  process.exit(1);
}

main();
