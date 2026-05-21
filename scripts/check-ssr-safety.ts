#!/usr/bin/env tsx
/**
 * SSR safety lint — scans the server-callable layers of
 * `@vizel/core` for top-level (module-scope) `document.` or `window.`
 * references that would crash at import time on the server.
 *
 * Permitted layers:
 *
 * - `packages/core/src/utils/`
 * - `packages/core/src/builders/`
 * - `packages/core/src/commands/`
 * - `packages/core/src/markdown/`
 * - `packages/core/src/types.ts`
 * - `packages/core/src/index.ts`
 *
 * References INSIDE function bodies are allowed (the browser-only
 * surface is exercised lazily). The script flags references at the
 * file's module scope and exits non-zero if any are found.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleFile = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(moduleFile), "..");
const CORE_SRC = join(REPO_ROOT, "packages", "core", "src");

const SCANNED_DIRS = ["utils", "builders", "commands", "markdown"];
const SCANNED_ROOT_FILES = ["types.ts", "index.ts"];

const BANNED_PATTERNS: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /\bdocument\s*\./, label: "document." },
  { pattern: /\bwindow\s*\./, label: "window." },
];

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly snippet: string;
  readonly label: string;
}

function collectFiles(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
}

/**
 * Walk the source and count braces to track scope depth.
 * Depth 0 is module scope; any positive depth is inside a function /
 * class / block. References at depth > 0 are permitted.
 */
function findModuleScopeViolations(file: string, source: string): Violation[] {
  const lines = source.split("\n");
  const violations: Violation[] = [];
  let depth = 0;
  let inBlockComment = false;
  let inLineComment = false;
  let inString: '"' | "'" | "`" | null = null;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx] ?? "";
    inLineComment = false;
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      const next = line[col + 1];
      if (inLineComment) break;
      if (inBlockComment) {
        if (ch === "*" && next === "/") {
          inBlockComment = false;
          col++;
        }
        continue;
      }
      if (inString) {
        if (ch === "\\") {
          col++;
          continue;
        }
        if (ch === inString) {
          inString = null;
        }
        continue;
      }
      if (ch === "/" && next === "/") {
        inLineComment = true;
        break;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        col++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") depth = Math.max(0, depth - 1);
    }
    if (depth !== 0 || inBlockComment) continue;
    for (const { pattern, label } of BANNED_PATTERNS) {
      const match = pattern.exec(line);
      if (!match) continue;
      const column = (match.index ?? 0) + 1;
      violations.push({
        file,
        line: lineIdx + 1,
        column,
        snippet: line.trim(),
        label,
      });
    }
  }
  return violations;
}

function main(): void {
  const files: string[] = [];
  for (const dir of SCANNED_DIRS) {
    collectFiles(join(CORE_SRC, dir), files);
  }
  for (const name of SCANNED_ROOT_FILES) {
    files.push(join(CORE_SRC, name));
  }

  const violations: Violation[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    violations.push(...findModuleScopeViolations(file, source));
  }

  if (violations.length === 0) {
    process.stdout.write("SSR safety check passed.\n");
    process.exit(0);
  }

  process.stderr.write(
    `SSR safety check failed (${violations.length} violation${violations.length === 1 ? "" : "s"}):\n`
  );
  for (const v of violations) {
    const rel = relative(REPO_ROOT, v.file);
    process.stderr.write(`  ${rel}:${v.line}:${v.column}: ${v.label} at module scope\n`);
    process.stderr.write(`    ${v.snippet}\n`);
  }
  process.exit(1);
}

main();
