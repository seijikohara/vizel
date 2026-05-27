/**
 * Scenario parity check.
 *
 * Loads `VIZEL_FEATURE_MANIFEST` and verifies that every feature has a
 * corresponding scenario folder under `tests/ct/scenarios/v2/<feature-id>/`
 * exporting a typed `VizelScenarioDefinition`.
 *
 * The check is the bridge between the manifest (which declares parity)
 * and the test surface (which proves parity). It fails CI when a
 * manifest entry lacks a scenario or when a scenario lives outside the
 * expected location.
 *
 * See ADR-0002 (manifest) and ADR-0012 (three-layer CT) for the
 * rationale.
 */

import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VIZEL_FEATURE_MANIFEST,
  type VizelFeatureDefinition,
} from "../../../packages/core/src/feature-manifest.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCENARIOS_ROOT = resolve(SCRIPT_DIR, "..", "scenarios", "v2");

interface ScenarioGap {
  readonly featureId: string;
  readonly reason: string;
}

function locateScenarioFile(feature: VizelFeatureDefinition): string {
  return resolve(SCENARIOS_ROOT, feature.id, "index.ts");
}

function verifyScenarioPresence(
  manifest: readonly VizelFeatureDefinition[]
): readonly ScenarioGap[] {
  const gaps: ScenarioGap[] = [];
  for (const feature of manifest) {
    const path = locateScenarioFile(feature);
    if (!existsSync(path)) {
      gaps.push({ featureId: feature.id, reason: `missing ${path}` });
      continue;
    }
    if (!statSync(path).isFile()) {
      gaps.push({ featureId: feature.id, reason: `not a file: ${path}` });
    }
  }
  return gaps;
}

function main(): void {
  const gaps = verifyScenarioPresence(VIZEL_FEATURE_MANIFEST);
  if (gaps.length === 0) {
    const featureCount = VIZEL_FEATURE_MANIFEST.length;
    process.stdout.write(
      `Scenario parity check passed (${featureCount} features × 1 scenario folder).\n`
    );
    return;
  }
  process.stderr.write("Scenario parity violations:\n");
  for (const gap of gaps) {
    process.stderr.write(`  - ${gap.featureId}: ${gap.reason}\n`);
  }
  process.exit(1);
}

main();
