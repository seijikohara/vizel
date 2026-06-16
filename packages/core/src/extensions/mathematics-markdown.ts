/**
 * markdown-it rules for the mathematics extension.
 *
 * Pure, DOM-free helpers: the input-rule regexes plus the inline (`$...$`)
 * and block (`$$...$$`) markdown-it rules whose emitted HTML matches the
 * math node `parseHTML`, so markdown round-trip restores typed nodes.
 */

import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

/**
 * Input rule regex for inline math: $...$
 * Matches $ followed by non-$ characters, ending with $
 */
export const INLINE_MATH_REGEX = /\$([^$\n]+)\$$/;

/**
 * Input rule regex for block math: $$...$$
 * Matches $$ followed by content, ending with $$
 */
export const BLOCK_MATH_REGEX = /\$\$([^$]+)\$\$$/;

/**
 * Register a markdown-it inline rule that recognizes `$...$` math.
 *
 * The rule emits HTML matching `VizelMathInline.parseHTML` so that
 * markdown round-trip restores math expressions to typed nodes.
 */
export function registerMathInlineRule(md: MarkdownIt): void {
  md.inline.ruler.before("escape", "vizel_math_inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x24) return false;
    if (state.src.charCodeAt(state.pos + 1) === 0x24) return false;
    const end = state.src.indexOf("$", state.pos + 1);
    if (end === -1) return false;
    const latex = state.src.slice(state.pos + 1, end);
    if (!latex || /\n/.test(latex)) return false;
    if (!silent) {
      const token = state.push("vizel_math_inline", "span", 0);
      token.content = latex;
    }
    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.vizel_math_inline = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    const escaped = latex.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<span data-type="math-inline" data-latex="${escaped}" class="vizel-math vizel-math-inline"></span>`;
  };
}

/**
 * Register a markdown-it block rule that recognizes `$$...$$` math.
 */
function readMathLine(state: StateBlock, lineIndex: number): string {
  const pos = (state.bMarks[lineIndex] ?? 0) + (state.tShift[lineIndex] ?? 0);
  const max = state.eMarks[lineIndex] ?? state.src.length;
  return state.src.slice(pos, max);
}

function findMathBlockClose(state: StateBlock, startLine: number, endLine: number): number {
  const fromLine = startLine + 1;
  const candidate = Array.from(
    { length: Math.max(0, endLine - fromLine) },
    (_, i) => fromLine + i
  ).find((line) => readMathLine(state, line).trim() === "$$");
  return candidate ?? -1;
}

export function registerMathBlockRule(md: MarkdownIt): void {
  md.block.ruler.before(
    "fence",
    "vizel_math_block",
    (state, startLine, endLine, silent) => {
      const firstLine = readMathLine(state, startLine);
      if (!firstLine.startsWith("$$")) return false;

      const singleLineMatch = /^\$\$([\s\S]+)\$\$\s*$/.exec(firstLine);
      if (singleLineMatch) {
        if (silent) return true;
        emitMathBlock(state, singleLineMatch[1]?.trim() ?? "", startLine, startLine);
        state.line = startLine + 1;
        return true;
      }

      if (firstLine.slice(2).trim().length > 0) return false;
      const closingLine = findMathBlockClose(state, startLine, endLine);
      if (closingLine === -1) return false;
      if (silent) return true;
      const content = state.getLines(
        startLine + 1,
        closingLine,
        state.tShift[startLine] ?? 0,
        false
      );
      emitMathBlock(state, content.trim(), startLine, closingLine);
      state.line = closingLine + 1;
      return true;
    },
    { alt: ["paragraph"] }
  );

  md.renderer.rules.vizel_math_block = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    const escaped = latex.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<div data-type="math-block" data-latex="${escaped}" class="vizel-math vizel-math-block"></div>`;
  };
}

function emitMathBlock(state: StateBlock, latex: string, startLine: number, endLine: number): void {
  const token = state.push("vizel_math_block", "div", 0);
  token.content = latex;
  token.block = true;
  token.map = [startLine, endLine + 1];
}
