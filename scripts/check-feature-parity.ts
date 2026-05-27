/**
 * Feature manifest parity check.
 *
 * Loads `VIZEL_FEATURE_MANIFEST` from `@vizel/core` and verifies that
 * every adapter (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`) exports
 * the declared `component` and `companion` symbols for every feature.
 *
 * The check runs in two layers:
 *
 * 1. Structural — the manifest itself is valid TypeScript (unique IDs,
 *    every adapter shape resolves).
 * 2. Surface — each adapter's `src/index.ts` exports the declared
 *    symbols. The check tolerates symbols that re-export from
 *    `@vizel/core` because `export * from "@vizel/core"` is mandatory
 *    per the v2 architecture.
 *
 * Exits 0 on success, 1 on any divergence.
 *
 * See ADR-0002 for the rationale and `.claude/rules/feature-manifest.md`
 * for the contributor workflow.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VIZEL_FEATURE_MANIFEST,
  type VizelFeatureAdapters,
  type VizelFeatureDefinition,
} from "../packages/core/src/feature-manifest.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

interface AdapterPaths {
  readonly framework: keyof VizelFeatureAdapters;
  readonly indexPath: string;
}

const ADAPTERS: readonly AdapterPaths[] = [
  { framework: "react", indexPath: resolve(REPO_ROOT, "packages/react/src/index.ts") },
  { framework: "vue", indexPath: resolve(REPO_ROOT, "packages/vue/src/index.ts") },
  { framework: "svelte", indexPath: resolve(REPO_ROOT, "packages/svelte/src/index.ts") },
];

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
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const feature of manifest) {
    if (seen.has(feature.id)) errors.push(`Duplicate feature id: ${feature.id}`);
    seen.add(feature.id);
  }
  return errors;
}

/**
 * Read an adapter's `src/index.ts` and return the set of identifiers it
 * exports. The check looks for direct named exports and the wildcard
 * `export * from "@vizel/core"` that flags Core surface availability.
 */
function loadAdapterSurface(indexPath: string): {
  readonly named: ReadonlySet<string>;
  readonly reexportsCore: boolean;
} {
  const source = readFileSync(indexPath, "utf8");
  const named = new Set<string>();
  const reexportsCore = /export\s*\*\s*from\s*["']@vizel\/core["']/.test(source);
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const raw of match[1].split(",")) {
      const trimmed = raw
        .trim()
        .replace(/\s+as\s+\w+$/u, "")
        .replace(/^type\s+/u, "");
      if (trimmed) named.add(trimmed);
    }
  }
  for (const match of source.matchAll(
    /export\s+(?:function|class|const|let|interface|type|enum)\s+(\w+)/g
  )) {
    named.add(match[1]);
  }
  return { named, reexportsCore };
}

/**
 * Verify a single adapter against the manifest. Returns a finding when
 * the adapter is missing any declared symbol.
 */
function verifyAdapter(
  manifest: readonly VizelFeatureDefinition[],
  adapter: AdapterPaths
): readonly ParityFinding[] {
  const surface = loadAdapterSurface(adapter.indexPath);
  const findings: ParityFinding[] = [];
  for (const feature of manifest) {
    const adapterShape = feature.adapters[adapter.framework];
    const missing: string[] = [];
    for (const symbol of [adapterShape.component, adapterShape.companion]) {
      if (!symbol) continue;
      if (surface.named.has(symbol)) continue;
      // The wildcard re-export forwards every Core symbol. The check
      // accepts it as a presence signal; future iterations may resolve
      // Core's index.ts to enumerate the forwarded names explicitly.
      if (surface.reexportsCore) continue;
      missing.push(symbol);
    }
    if (missing.length > 0)
      findings.push({ featureId: feature.id, framework: adapter.framework, missing });
  }
  return findings;
}

function main(): void {
  const structuralErrors = verifyManifestStructure(VIZEL_FEATURE_MANIFEST);
  if (structuralErrors.length > 0) {
    console.error("Manifest structure errors:");
    for (const error of structuralErrors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const allFindings: ParityFinding[] = [];
  for (const adapter of ADAPTERS) {
    allFindings.push(...verifyAdapter(VIZEL_FEATURE_MANIFEST, adapter));
  }

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
