/**
 * KaTeX rendering for the mathematics extension.
 *
 * Pure, DOM-free helpers: a cached lazy loader for the optional `katex`
 * dependency and a render function that returns sanitized HTML plus an
 * error string. The node specs in `mathematics.ts` consume `renderKatex`.
 */

import type katex from "katex";
import { createLazyLoader } from "../utils/lazy-import.ts";

/**
 * Lazy loader for katex (optional dependency)
 */
export const loadKatex = createLazyLoader("katex", async () => {
  const mod = await import("katex");
  return mod.default;
});

/**
 * Render LaTeX to HTML using KaTeX.
 * Loads the katex module dynamically on first use.
 */
export async function renderKatex(
  latex: string,
  displayMode: boolean,
  options?: katex.KatexOptions
): Promise<{ html: string; error: string | null }> {
  try {
    const katexModule = await loadKatex();
    const html = katexModule.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      ...options,
      trust: false, // Enforced: prevents external URL access via \url, \href commands
    });
    return { html, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid LaTeX";
    const escaped = errorMessage
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return {
      html: `<span class="vizel-math-error">${escaped}</span>`,
      error: errorMessage,
    };
  }
}
