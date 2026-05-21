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
interface LexerState {
  depth: number;
  inBlockComment: boolean;
  inString: '"' | "'" | "`" | null;
}

interface LineLexer {
  inLineComment: boolean;
  skipNext: boolean;
}

/**
 * Apply a single character to the lexer state. Mutates `lexer` and
 * `lineLexer` to reflect the new lexer state. Returns `true` when the
 * caller should `break` out of the per-character loop (line-comment hit).
 */
function stepLexer(
  ch: string | undefined,
  next: string | undefined,
  lexer: LexerState,
  lineLexer: LineLexer
): boolean {
  if (lineLexer.skipNext) {
    lineLexer.skipNext = false;
    return false;
  }
  if (lineLexer.inLineComment) return true;
  if (lexer.inBlockComment) {
    if (ch === "*" && next === "/") {
      lexer.inBlockComment = false;
      lineLexer.skipNext = true;
    }
    return false;
  }
  if (lexer.inString) {
    if (ch === "\\") {
      lineLexer.skipNext = true;
      return false;
    }
    if (ch === lexer.inString) lexer.inString = null;
    return false;
  }
  if (ch === "/" && next === "/") {
    lineLexer.inLineComment = true;
    return true;
  }
  if (ch === "/" && next === "*") {
    lexer.inBlockComment = true;
    lineLexer.skipNext = true;
    return false;
  }
  if (ch === '"' || ch === "'" || ch === "`") {
    lexer.inString = ch;
    return false;
  }
  if (ch === "{") lexer.depth += 1;
  else if (ch === "}") lexer.depth = Math.max(0, lexer.depth - 1);
  return false;
}

function collectLineViolations(file: string, line: string, lineIdx: number): Violation[] {
  return BANNED_PATTERNS.flatMap(({ pattern, label }) => {
    const match = pattern.exec(line);
    if (!match) return [];
    return [
      {
        file,
        line: lineIdx + 1,
        column: (match.index ?? 0) + 1,
        snippet: line.trim(),
        label,
      },
    ];
  });
}

function findModuleScopeViolations(file: string, source: string): Violation[] {
  const lexer: LexerState = { depth: 0, inBlockComment: false, inString: null };
  const lines = source.split("\n");
  const violations: Violation[] = [];

  for (const [lineIdx, line] of lines.entries()) {
    const lineLexer: LineLexer = { inLineComment: false, skipNext: false };
    const chars = [...line];
    for (const [col, ch] of chars.entries()) {
      if (stepLexer(ch, line[col + 1], lexer, lineLexer)) break;
    }
    if (lexer.depth !== 0 || lexer.inBlockComment) continue;
    violations.push(...collectLineViolations(file, line, lineIdx));
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
