#!/usr/bin/env tsx
/**
 * Playwright CT spec parity check.
 *
 * Verifies that `tests/ct/{react,vue,svelte}/specs/` contain matching
 * spec files, modulo the framework idiom prefix stripped from hook /
 * composable / rune-named specs (`UseFoo` in React and Vue,
 * `CreateFoo` in Svelte). The seventh testing pillar in Section 14 of
 * the v2.0.0 spec requires this check; lefthook runs it on `pre-push`
 * and CI gates merges on a green run.
 *
 * Scope and conventions:
 *
 * - Only files matching `*.spec.tsx` (React) or `*.spec.ts` (Vue,
 *   Svelte) are considered. Fixture and helper files (`*Fixture.tsx`,
 *   `*.helper.ts`) are intentionally excluded — they live next to
 *   specs but do not represent a coverage unit.
 * - Idiom prefixes mirror the symbol parity rules in
 *   `scripts/check-cross-framework-parity.ts`. React and Vue may
 *   prefix a spec with `Use` (e.g. `UseEditorState.spec.tsx`); Svelte
 *   prefixes the equivalent rune spec with `Create` (e.g.
 *   `CreateEditorState.spec.ts`). Both forms reduce to the same stem
 *   `EditorState`.
 *
 * Exits with code 0 on success, 1 on any spec-name imbalance.
 */
import { readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleFile = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(moduleFile), "..");

interface FrameworkSpec {
  readonly framework: "react" | "vue" | "svelte";
  readonly specsDir: string;
  readonly extensions: readonly string[];
  /**
   * Idiom prefixes stripped from a spec basename to derive its parity
   * stem. The order matters: longer / more-specific prefixes appear
   * first so a name like `UseFoo` does not collapse to `seFoo`.
   */
  readonly prefixes: readonly string[];
}

const FRAMEWORKS: readonly FrameworkSpec[] = [
  {
    framework: "react",
    specsDir: join(REPO_ROOT, "tests/ct/react/specs"),
    extensions: [".spec.tsx", ".spec.ts"],
    prefixes: ["Use", "Create"],
  },
  {
    framework: "vue",
    specsDir: join(REPO_ROOT, "tests/ct/vue/specs"),
    extensions: [".spec.ts"],
    prefixes: ["Use", "Create"],
  },
  {
    framework: "svelte",
    specsDir: join(REPO_ROOT, "tests/ct/svelte/specs"),
    extensions: [".spec.ts"],
    prefixes: ["Create", "Get"],
  },
];

interface ParitySpec {
  /** Basename minus extension (e.g. `Editor`, `UseEditorState`). */
  readonly literalName: string;
  /** Parity stem after idiom prefix stripping (e.g. `EditorState`). */
  readonly stem: string;
}

/**
 * Strip a recognized idiom prefix from a spec basename and return the
 * stem. Returns the original name when no prefix applies (the literal
 * name itself is the stem in that case — components, integration
 * specs, and shared scenarios fall here).
 */
function deriveStem(name: string, prefixes: readonly string[]): string {
  for (const prefix of prefixes) {
    if (!name.startsWith(prefix) || name.length <= prefix.length) continue;
    // Next character must be uppercase to avoid swallowing names like
    // `Userflows` matching the `User` prefix.
    const next = name.charAt(prefix.length);
    if (next === next.toUpperCase() && next !== next.toLowerCase()) {
      return name.slice(prefix.length);
    }
  }
  return name;
}

/**
 * Strip the longest matching spec extension from a file name. Returns
 * `null` when no spec extension matches (i.e. the file is a fixture
 * or helper).
 */
function stripSpecExtension(file: string, extensions: readonly string[]): string | null {
  // Sort by descending length so `.spec.tsx` is tried before `.spec.ts`.
  const sorted = [...extensions].sort((a, b) => b.length - a.length);
  for (const ext of sorted) {
    if (file.endsWith(ext)) return file.slice(0, -ext.length);
  }
  return null;
}

function collectSpecs(config: FrameworkSpec): readonly ParitySpec[] {
  try {
    statSync(config.specsDir);
  } catch {
    return [];
  }
  const entries = readdirSync(config.specsDir);
  return entries.flatMap((entry) => {
    const full = join(config.specsDir, entry);
    const stat = statSync(full);
    if (!stat.isFile()) return [];
    const literalName = stripSpecExtension(entry, config.extensions);
    if (literalName === null) return [];
    return [{ literalName, stem: deriveStem(literalName, config.prefixes) }];
  });
}

interface ParityViolation {
  readonly stem: string;
  readonly missing: readonly ("react" | "vue" | "svelte")[];
  readonly present: ReadonlyMap<"react" | "vue" | "svelte", string>;
}

function findViolations(
  specsByFramework: ReadonlyMap<"react" | "vue" | "svelte", readonly ParitySpec[]>
): readonly ParityViolation[] {
  const stemToFramework = new Map<string, Map<"react" | "vue" | "svelte", string>>();
  for (const [framework, specs] of specsByFramework) {
    for (const spec of specs) {
      const bucket = stemToFramework.get(spec.stem) ?? new Map();
      bucket.set(framework, spec.literalName);
      stemToFramework.set(spec.stem, bucket);
    }
  }

  const violations: ParityViolation[] = [];
  for (const [stem, present] of stemToFramework) {
    const missing: ("react" | "vue" | "svelte")[] = [];
    for (const config of FRAMEWORKS) {
      if (!present.has(config.framework)) missing.push(config.framework);
    }
    if (missing.length > 0) {
      violations.push({ stem, missing, present });
    }
  }
  return violations;
}

function main(): void {
  const specsByFramework = new Map<"react" | "vue" | "svelte", readonly ParitySpec[]>();
  for (const config of FRAMEWORKS) {
    specsByFramework.set(config.framework, collectSpecs(config));
  }

  const counts = [...specsByFramework.entries()]
    .map(([framework, specs]) => `${framework}=${specs.length}`)
    .join(", ");
  process.stdout.write(`CT spec parity check (${counts})\n`);

  const violations = findViolations(specsByFramework);

  if (violations.length === 0) {
    process.stdout.write("CT spec parity check passed.\n");
    process.exit(0);
  }

  const plural = violations.length === 1 ? "" : "s";
  process.stderr.write(`CT spec parity check failed (${violations.length} violation${plural}):\n`);
  for (const violation of violations) {
    const presentParts = [...violation.present.entries()]
      .map(([fw, name]) => `${fw}=${name}`)
      .join(", ");
    process.stderr.write(
      `  stem "${violation.stem}" missing from ${violation.missing.join(", ")} (have: ${presentParts})\n`
    );
  }
  process.stderr.write(
    "\nEach Playwright CT spec must exist in all three framework packages.\n" +
      "React and Vue specs that wrap a hook / composable may use a `Use` prefix;\n" +
      "the Svelte rune counterpart uses `Create` (or `Get` for context getters).\n" +
      "Both forms reduce to the same parity stem.\n"
  );
  process.exit(1);
}

main();
