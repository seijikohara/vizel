/**
 * Flat-scenario coverage check.
 *
 * Vizel's behavioral coverage lives in `tests/ct/scenarios/*.scenario.ts`.
 * Each scenario exports one or more `test*` functions; per-framework specs
 * under `tests/ct/{react,vue,svelte}/specs/` import the scenario through the
 * literal specifier `../../scenarios/<basename>.scenario` and invoke its
 * `test*` exports inside Playwright `test(...)` blocks.
 *
 * This check proves the coverage is real, not declared:
 *
 * 1. Every flat scenario exports at least one `test*` function.
 * 2. Every framework's spec imports the scenario's specifier and invokes at
 *    least one of its `test*` exports.
 *
 * The check exits 1 with a precise message when a scenario exposes no `test*`
 * export, or when a framework's spec stops importing or invoking a scenario.
 * Spec filenames differ across frameworks (the `Use*`/`Create*` idiom), so the
 * check matches the import specifier, never the filename.
 *
 * Run with `node tests/ct/parity/check-scenarios.ts`.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CT_ROOT = resolve(SCRIPT_DIR, "..");
const SCENARIOS_DIR = resolve(CT_ROOT, "scenarios");

/** Frameworks whose specs must each import and invoke every scenario. */
const FRAMEWORKS = ["react", "vue", "svelte"] as const;
type Framework = (typeof FRAMEWORKS)[number];

const SCENARIO_SUFFIX = ".scenario.ts";
const TEST_FN_PREFIX = "test";

interface ScenarioGap {
  readonly scenario: string;
  readonly reason: string;
}

/** Parse a TypeScript source file from disk without type-checking. */
const parseSourceFile = (filePath: string): ts.SourceFile =>
  ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

/** Return true when a statement carries the `export` modifier. */
const hasExportModifier = (node: ts.Statement): boolean =>
  ts.canHaveModifiers(node)
    ? (ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
      false)
    : false;

/**
 * Collect the exported `test*` function names declared in a scenario file.
 *
 * The contract recognises function declarations only; helper exports such as
 * `simulateFileDrop` or `createMockImageFile` carry no `test` prefix and are
 * ignored.
 */
function collectExportedTestFunctions(scenarioPath: string): readonly string[] {
  const source = parseSourceFile(scenarioPath);
  return source.statements.flatMap((statement) => {
    if (
      ts.isFunctionDeclaration(statement) &&
      hasExportModifier(statement) &&
      statement.name?.text.startsWith(TEST_FN_PREFIX)
    ) {
      return [statement.name.text];
    }
    return [];
  });
}

/** List every flat scenario basename (without the `.scenario.ts` suffix). */
function listScenarioBasenames(): readonly string[] {
  // Exclude in-migration Vitest Browser scenarios (`*-bc.scenario.ts`). They
  // run through their own `.bc.test` specs, outside the Playwright parity model,
  // until every framework adopts Vitest Browser Mode (see the migration spec).
  return readdirSync(SCENARIOS_DIR)
    .filter((entry) => entry.endsWith(SCENARIO_SUFFIX) && !entry.endsWith("-bc.scenario.ts"))
    .map((entry) => entry.slice(0, -SCENARIO_SUFFIX.length))
    .sort();
}

/** List every spec file path for one framework. */
function listSpecFiles(framework: Framework): readonly string[] {
  const specsDir = resolve(CT_ROOT, framework, "specs");
  return readdirSync(specsDir)
    .filter((entry) => entry.endsWith(".spec.ts") || entry.endsWith(".spec.tsx"))
    .map((entry) => resolve(specsDir, entry));
}

interface SpecImport {
  /** Scenario basename the spec imports, e.g. `find-replace`. */
  readonly scenario: string;
  /** Identifiers brought into scope by the import clause. */
  readonly importedNames: readonly string[];
}

/** Return the scenario basename a module specifier targets, or `null`. */
const scenarioFromSpecifier = (specifier: string): string | null => {
  const match = specifier.match(/^\.\.\/\.\.\/scenarios\/([a-z0-9-]+)\.scenario$/);
  return match === null ? null : match[1];
};

/** Collect every scenario import together with the names it brings into scope. */
function collectSpecImports(specPath: string): readonly SpecImport[] {
  const source = parseSourceFile(specPath);
  return source.statements.flatMap((statement) => {
    if (!(ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier))) {
      return [];
    }
    const scenario = scenarioFromSpecifier(statement.moduleSpecifier.text);
    const namedBindings = statement.importClause?.namedBindings;
    if (scenario === null || namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
      return [];
    }
    const importedNames = namedBindings.elements.map((element) => element.name.text);
    return [{ scenario, importedNames }];
  });
}

/** Collect every identifier the spec invokes as a call-expression callee. */
function collectInvokedIdentifiers(specPath: string): ReadonlySet<string> {
  const source = parseSourceFile(specPath);
  const invoked = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      invoked.add(node.expression.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return invoked;
}

/**
 * Compute, per framework, the set of scenarios each framework both imports and
 * invokes. A scenario counts as covered by a framework when one of its specs
 * imports the scenario specifier and invokes at least one imported name that is
 * an exported `test*` function of that scenario.
 */
function collectCoverage(
  testFunctionsByScenario: ReadonlyMap<string, readonly string[]>
): ReadonlyMap<Framework, ReadonlySet<string>> {
  return new Map(
    FRAMEWORKS.map((framework) => {
      const covered = new Set<string>();
      for (const specPath of listSpecFiles(framework)) {
        const invoked = collectInvokedIdentifiers(specPath);
        for (const specImport of collectSpecImports(specPath)) {
          const testFunctions = testFunctionsByScenario.get(specImport.scenario) ?? [];
          const invokesTest = specImport.importedNames.some(
            (name) => testFunctions.includes(name) && invoked.has(name)
          );
          if (invokesTest) covered.add(specImport.scenario);
        }
      }
      return [framework, covered] as const;
    })
  );
}

/** Verify every flat scenario satisfies the coverage contract. */
function verifyScenarios(): readonly ScenarioGap[] {
  const scenarios = listScenarioBasenames();
  const testFunctionsByScenario = new Map(
    scenarios.map((scenario) => [
      scenario,
      collectExportedTestFunctions(resolve(SCENARIOS_DIR, `${scenario}${SCENARIO_SUFFIX}`)),
    ])
  );
  const coverage = collectCoverage(testFunctionsByScenario);

  return scenarios.flatMap((scenario) => {
    const testFunctions = testFunctionsByScenario.get(scenario) ?? [];
    if (testFunctions.length === 0) {
      return [
        {
          scenario,
          reason: `scenario exports no test* function (expected at least one)`,
        },
      ];
    }
    const uncovered = FRAMEWORKS.filter((framework) => !coverage.get(framework)?.has(scenario));
    if (uncovered.length > 0) {
      return [
        {
          scenario,
          reason: `no spec imports '../../scenarios/${scenario}.scenario' and invokes one of its test* functions for: ${uncovered.join(", ")}`,
        },
      ];
    }
    return [];
  });
}

function main(): void {
  const gaps = verifyScenarios();
  if (gaps.length === 0) {
    const count = listScenarioBasenames().length;
    process.stdout.write(
      `Scenario coverage check passed (${count} flat scenarios, each with an invoked test function across ${FRAMEWORKS.join(", ")}).\n`
    );
    return;
  }
  process.stderr.write("Scenario coverage violations:\n");
  for (const gap of gaps) {
    process.stderr.write(`  - ${gap.scenario}: ${gap.reason}\n`);
  }
  process.exit(1);
}

main();
