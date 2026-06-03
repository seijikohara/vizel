#!/usr/bin/env tsx
/**
 * Manifest ARIA / keyboard contract check (Phase 1, static).
 *
 * The feature manifest (`packages/core/src/feature-manifest.ts`) declares
 * an `ariaContract` (`role` + `requiredAttributes`) and a `keyboardMap`
 * for every feature. Before this check those fields were advisory: no
 * tool verified that an adapter actually rendered the declared role or
 * attribute, so the manifest could claim a contract the components never
 * honoured. This check closes that gap statically.
 *
 * For every feature whose `ariaContract` declares a `role` or a non-empty
 * `requiredAttributes` list, the check resolves each adapter component
 * (`packages/<fw>/src/components/<Component>.{tsx,vue,svelte}`) and asserts
 * that:
 *
 * 1. the declared role appears in the component source — either as a
 *    literal (`role="X"`, `role={"X"}`, `role: "X"`) or, when the
 *    component renders the role off a builder spec (`role={spec.root.role}`,
 *    `:role="spec.root.role"`), through the feature's builder file under
 *    `packages/core/src/builders/`; and
 * 2. every `requiredAttributes` entry appears the same way — as a literal
 *    attribute in the component or as an attribute literal in the builder
 *    spec.
 *
 * For `keyboardMap`, the check asserts that every binding key belongs to
 * the allow-list formed by the union of (a) every `VizelCommand`
 * identifier parsed from `packages/core/src/commands/registry/*.ts` and
 * (b) the navigation-verb vocabulary exported as `VIZEL_KEYBOARD_COMMANDS`
 * from the manifest. Deriving the allow-list from source keeps it from
 * rotting when the registry or the verb vocabulary changes.
 *
 * Scope note (Decision D-7, A-PHASED): this is the STATIC phase. It
 * verifies presence in source, not the rendered Document Object Model
 * (DOM). Runtime axe / keyboard enforcement is Phase 2, deferred to the
 * accessibility CI follow-up.
 *
 * Companion-only features (no adapter `component`) carry no component
 * source to inspect; the check skips them with a logged advisory note
 * rather than passing them silently. The manifest JSDoc records the same
 * static-versus-runtime split.
 *
 * Exits 0 on success with a summary line, 1 on any divergence naming the
 * feature, framework, and missing role / attribute / command.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VIZEL_FEATURE_MANIFEST,
  VIZEL_KEYBOARD_COMMANDS,
  type VizelFeatureAdapters,
  type VizelFeatureDefinition,
} from "../packages/core/src/feature-manifest.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const BUILDERS_DIR = resolve(REPO_ROOT, "packages/core/src/builders");
const REGISTRY_DIR = resolve(REPO_ROOT, "packages/core/src/commands/registry");

type Framework = keyof VizelFeatureAdapters;

interface FrameworkPaths {
  readonly framework: Framework;
  readonly componentsDir: string;
  readonly extension: string;
}

const FRAMEWORKS: readonly FrameworkPaths[] = [
  {
    framework: "react",
    componentsDir: resolve(REPO_ROOT, "packages/react/src/components"),
    extension: ".tsx",
  },
  {
    framework: "vue",
    componentsDir: resolve(REPO_ROOT, "packages/vue/src/components"),
    extension: ".vue",
  },
  {
    framework: "svelte",
    componentsDir: resolve(REPO_ROOT, "packages/svelte/src/components"),
    extension: ".svelte",
  },
];

interface ContractFinding {
  readonly featureId: string;
  readonly framework: Framework;
  readonly kind: "role" | "attribute";
  readonly token: string;
}

interface AdvisoryNote {
  readonly featureId: string;
  readonly framework: Framework;
  readonly reason: string;
}

/**
 * Read a component file's source, or `null` when the file is absent. The
 * caller treats a `null` as an advisory skip rather than a failure.
 */
function readComponentSource(feature: FrameworkPaths, component: string): string | null {
  const filePath = join(feature.componentsDir, `${component}${feature.extension}`);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
}

/**
 * Resolve the builder source for a feature, or `null` when no builder
 * file exists. The manifest maps a feature to its builder by the feature
 * id (`bubble-menu` -> `builders/bubble-menu.ts`), which holds for every
 * spec-rendering feature (`outline`, `slash-menu`, `mention-menu`,
 * `block-menu`, `node-selector`, `toolbar-dropdown`). The check folds the
 * builder source into the ARIA search so a component that renders
 * `role={spec.root.role}` still resolves to its declared role literal.
 */
function readBuilderSource(feature: VizelFeatureDefinition): string | null {
  const filePath = join(BUILDERS_DIR, `${feature.id}.ts`);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
}

/**
 * Return whether a role literal appears in a source string. Matches the
 * three literal forms a framework template uses: `role="X"` (JSX / Vue /
 * Svelte attribute), `role={"X"}` (JSX expression), and `role: "X"`
 * (builder spec property).
 */
const roleAppears = (source: string, role: string): boolean => {
  const patterns = [
    `role="${role}"`,
    `role='${role}'`,
    `role={"${role}"}`,
    `role={'${role}'}`,
    `role: "${role}"`,
    `role: '${role}'`,
  ];
  return patterns.some((pattern) => source.includes(pattern));
};

/**
 * Return whether an ARIA attribute name appears in a source string. The
 * attribute matches whether the template binds it statically (`aria-label=`)
 * or dynamically (`:aria-label=` in Vue, `"aria-label":` in a builder
 * spec or a JSX spread object).
 */
const attributeAppears = (source: string, attribute: string): boolean => {
  const patterns = [`${attribute}=`, `:${attribute}=`, `"${attribute}"`, `'${attribute}'`];
  return patterns.some((pattern) => source.includes(pattern));
};

/**
 * Verify one feature's ARIA contract against one framework's component.
 * Return findings for every missing role or attribute; an empty array
 * means the component honours the contract. A component the framework
 * does not declare yields an advisory skip handled by the caller.
 */
function verifyAriaForFramework(
  feature: VizelFeatureDefinition,
  framework: FrameworkPaths,
  builderSource: string | null
): readonly ContractFinding[] {
  const component = feature.adapters[framework.framework].component;
  if (!component) return [];
  const componentSource = readComponentSource(framework, component);
  if (componentSource === null) return [];

  const haystacks = [componentSource, builderSource ?? ""];
  const declaredRole = feature.ariaContract.role;
  const roleFindings: readonly ContractFinding[] =
    typeof declaredRole === "string" &&
    !haystacks.some((source) => roleAppears(source, declaredRole))
      ? [
          {
            featureId: feature.id,
            framework: framework.framework,
            kind: "role",
            token: declaredRole,
          },
        ]
      : [];

  const attributeFindings = feature.ariaContract.requiredAttributes.flatMap((attribute) =>
    haystacks.some((source) => attributeAppears(source, attribute))
      ? []
      : [
          {
            featureId: feature.id,
            framework: framework.framework,
            kind: "attribute" as const,
            token: attribute,
          },
        ]
  );

  return [...roleFindings, ...attributeFindings];
}

interface AriaResult {
  readonly findings: readonly ContractFinding[];
  readonly advisories: readonly AdvisoryNote[];
  readonly checkedFeatureIds: ReadonlySet<string>;
}

/**
 * Verify the ARIA contract for every feature that declares a role or a
 * non-empty `requiredAttributes` list. A feature without any adapter
 * component (companion-only features such as `comment`) cannot be
 * statically inspected, so the check records it as an advisory note
 * instead of passing it silently.
 */
function verifyAriaContracts(manifest: readonly VizelFeatureDefinition[]): AriaResult {
  const relevant = manifest.filter(
    (feature) =>
      typeof feature.ariaContract.role === "string" ||
      feature.ariaContract.requiredAttributes.length > 0
  );

  const builderByFeature = new Map<string, string | null>(
    relevant.map((feature) => [feature.id, readBuilderSource(feature)])
  );

  const findings = relevant.flatMap((feature) =>
    FRAMEWORKS.flatMap((framework) =>
      verifyAriaForFramework(feature, framework, builderByFeature.get(feature.id) ?? null)
    )
  );

  const advisories = relevant.flatMap((feature) =>
    FRAMEWORKS.flatMap((framework) => {
      const component = feature.adapters[framework.framework].component;
      if (!component) {
        return [
          {
            featureId: feature.id,
            framework: framework.framework,
            reason: "companion-only adapter declares no component to inspect",
          },
        ];
      }
      return readComponentSource(framework, component) === null
        ? [
            {
              featureId: feature.id,
              framework: framework.framework,
              reason: `component file ${component}${framework.extension} not found`,
            },
          ]
        : [];
    })
  );

  return {
    findings,
    advisories,
    checkedFeatureIds: new Set(relevant.map((feature) => feature.id)),
  };
}

/**
 * Parse every `VizelCommand` identifier from the command registry source.
 * The check reads the literal `id: "..."` declarations rather than
 * importing the registry so the allow-list tracks the registry source and
 * cannot drift from it.
 */
function loadRegistryCommandIds(): ReadonlySet<string> {
  const idPattern = /\bid:\s*["']([^"']+)["']/g;
  const ids = readdirSync(REGISTRY_DIR)
    .filter((entry) => entry.endsWith(".ts") && !entry.endsWith(".d.ts"))
    .flatMap((entry) => {
      const source = readFileSync(join(REGISTRY_DIR, entry), "utf8");
      return [...source.matchAll(idPattern)].map((match) => match[1]);
    });
  return new Set(ids);
}

interface KeyboardFinding {
  readonly featureId: string;
  readonly command: string;
}

/**
 * Verify every keyboard-map binding key against the allow-list. The
 * allow-list is the union of the registry command identifiers and the
 * navigation-verb vocabulary the manifest exports.
 */
function verifyKeyboardMaps(
  manifest: readonly VizelFeatureDefinition[],
  allowList: ReadonlySet<string>
): readonly KeyboardFinding[] {
  return manifest.flatMap((feature) =>
    Object.keys(feature.keyboardMap.bindings)
      .filter((command) => !allowList.has(command))
      .map((command) => ({ featureId: feature.id, command }))
  );
}

function main(): void {
  const aria = verifyAriaContracts(VIZEL_FEATURE_MANIFEST);

  const registryIds = loadRegistryCommandIds();
  const keyboardAllowList = new Set<string>([...registryIds, ...VIZEL_KEYBOARD_COMMANDS]);
  const keyboardFindings = verifyKeyboardMaps(VIZEL_FEATURE_MANIFEST, keyboardAllowList);

  for (const advisory of aria.advisories) {
    process.stdout.write(
      `note: ${advisory.featureId} / ${advisory.framework} skipped (advisory): ${advisory.reason}\n`
    );
  }

  const hasFailures = aria.findings.length > 0 || keyboardFindings.length > 0;
  if (!hasFailures) {
    const featureCount = aria.checkedFeatureIds.size;
    process.stdout.write(
      `Manifest ARIA/keyboard contract check passed (${featureCount} features checked across ` +
        `${FRAMEWORKS.length} frameworks; keyboard allow-list = ${keyboardAllowList.size} commands).\n`
    );
    return;
  }

  process.stderr.write("Manifest ARIA/keyboard contract violations:\n");
  for (const finding of aria.findings) {
    process.stderr.write(
      `  - ${finding.featureId} / ${finding.framework}: missing ${finding.kind} "${finding.token}"\n`
    );
  }
  for (const finding of keyboardFindings) {
    process.stderr.write(
      `  - ${finding.featureId}: keyboardMap command "${finding.command}" is not in the registry or the navigation-verb allow-list\n`
    );
  }
  process.exit(1);
}

main();
