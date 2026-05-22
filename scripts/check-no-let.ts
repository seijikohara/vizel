#!/usr/bin/env tsx
/**
 * `let` enforcement — scans the project's TypeScript surface and fails
 * if any source file declares a mutable `let` binding. Vizel's source
 * is immutability-first; every reassignable counter, accumulator, or
 * timer handle lives inside a typed state object so the file scope
 * never needs `let`.
 *
 * Scope:
 *
 * - `packages/core/src/**\/*.ts`
 * - `packages/react/src/**\/*.{ts,tsx}`
 * - `packages/vue/src/**\/*.{ts,vue}` (script blocks only)
 * - `scripts/**\/*.ts`
 * - `tests/ct/scenarios/**\/*.ts`
 * - `tests/ct/react/specs/**\/*.{ts,tsx}`
 * - `tests/ct/vue/specs/**\/*.{ts,vue}` (script blocks only)
 * - `tests/a11y/scenarios/**\/*.ts`
 * - `tests/a11y/react/specs/**\/*.{ts,tsx}`
 * - `tests/a11y/vue/specs/**\/*.{ts,vue}` (script blocks only)
 * - `apps/demo/{react,vue}/src/**\/*.{ts,tsx,vue}` (script blocks only)
 *
 * Excluded:
 *
 * - Svelte components and runes (`*.svelte`, `*.svelte.ts`) because
 *   Svelte's reactivity model intentionally relies on `let` bindings.
 * - Build artifacts (`node_modules/`, `dist/`, `.svelte-kit/`,
 *   `.vite/`, `.cache/`) and any TypeScript declaration file (`*.d.ts`).
 *
 * Escape hatch:
 *
 * Add a `// biome-ignore lint/style/noLet: <reason>` comment on the
 * preceding line (or the same line) to opt the binding out — the
 * `<reason>` text is required and is surfaced in code review.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleFile = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(moduleFile), "..");

interface ScanRoot {
  readonly root: string;
  readonly extensions: ReadonlyArray<".ts" | ".tsx" | ".vue">;
}

const SCAN_ROOTS: readonly ScanRoot[] = [
  { root: "packages/core/src", extensions: [".ts"] },
  { root: "packages/react/src", extensions: [".ts", ".tsx"] },
  { root: "packages/vue/src", extensions: [".ts", ".vue"] },
  { root: "scripts", extensions: [".ts"] },
  { root: "tests/ct/scenarios", extensions: [".ts"] },
  { root: "tests/ct/react/specs", extensions: [".ts", ".tsx"] },
  { root: "tests/ct/vue/specs", extensions: [".ts", ".vue"] },
  { root: "tests/a11y/scenarios", extensions: [".ts"] },
  { root: "tests/a11y/react/specs", extensions: [".ts", ".tsx"] },
  { root: "tests/a11y/vue/specs", extensions: [".ts", ".vue"] },
  { root: "apps/demo/react/src", extensions: [".ts", ".tsx"] },
  { root: "apps/demo/vue/src", extensions: [".ts", ".vue"] },
];

const EXCLUDED_DIR_NAMES = new Set(["node_modules", "dist", ".svelte-kit", ".vite", ".cache"]);

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
}

function isExcludedFile(name: string): boolean {
  // Svelte components and rune files are excluded; their reactivity
  // contract requires `let` bindings.
  if (name.endsWith(".svelte")) return true;
  if (name.endsWith(".svelte.ts")) return true;
  if (name.endsWith(".d.ts")) return true;
  return false;
}

function collectFiles(
  dir: string,
  extensions: ReadonlyArray<".ts" | ".tsx" | ".vue">,
  out: string[]
): void {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIR_NAMES.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, extensions, out);
      continue;
    }
    if (isExcludedFile(entry)) continue;
    if (extensions.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
}

/**
 * Extract the TypeScript regions of a source string. Pure `.ts`/`.tsx`
 * files return the full source as a single region; `.vue` files return
 * each `<script ...>` body individually with its original line offset
 * preserved.
 */
function extractTypescriptRegions(
  file: string,
  source: string
): ReadonlyArray<{ readonly text: string; readonly lineOffset: number }> {
  if (!file.endsWith(".vue")) {
    return [{ text: source, lineOffset: 0 }];
  }
  const regions: { text: string; lineOffset: number }[] = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  const matches = [...source.matchAll(pattern)];
  for (const match of matches) {
    const body = match[1] ?? "";
    const preceding = source.slice(0, match.index ?? 0);
    const lineOffset = preceding.split("\n").length - 1 + 1;
    regions.push({ text: body, lineOffset });
  }
  return regions;
}

const LET_PATTERN = /^\s*let\s/;
const IGNORE_PATTERN = /biome-ignore\s+lint\/style\/noLet\s*:/;

function findRegionViolations(file: string, text: string, lineOffset: number): Violation[] {
  const lines = text.split("\n");
  return lines.flatMap((line, idx) => {
    if (!LET_PATTERN.test(line)) return [];
    // Same-line ignore comment.
    if (IGNORE_PATTERN.test(line)) return [];
    // Preceding-line ignore comment.
    const previous = lines[idx - 1] ?? "";
    if (IGNORE_PATTERN.test(previous)) return [];
    return [
      {
        file,
        line: lineOffset + idx + 1,
        snippet: line.trim(),
      },
    ];
  });
}

function findFileViolations(file: string, source: string): Violation[] {
  const regions = extractTypescriptRegions(file, source);
  return regions.flatMap((region) => findRegionViolations(file, region.text, region.lineOffset));
}

function main(): void {
  const files: string[] = [];
  for (const { root, extensions } of SCAN_ROOTS) {
    const abs = join(REPO_ROOT, root);
    try {
      statSync(abs);
    } catch {
      continue;
    }
    collectFiles(abs, extensions, files);
  }

  const violations = files.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return findFileViolations(file, source);
  });

  if (violations.length === 0) {
    process.stdout.write("No-let check passed.\n");
    process.exit(0);
  }

  const plural = violations.length === 1 ? "" : "s";
  process.stderr.write(`No-let check failed (${violations.length} violation${plural}):\n`);
  for (const v of violations) {
    const rel = relative(REPO_ROOT, v.file);
    process.stderr.write(`  ${rel}:${v.line}\n    ${v.snippet}\n`);
  }
  process.stderr.write(
    "\nVizel's TypeScript surface is immutability-first; use a typed state\n" +
      "object or a functional rewrite instead of `let`. To allow a specific\n" +
      "binding, add `// biome-ignore lint/style/noLet: <reason>` immediately\n" +
      "above it.\n"
  );
  process.exit(1);
}

main();
