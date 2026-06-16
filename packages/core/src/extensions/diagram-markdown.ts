/**
 * markdown-it fence handling for the diagram extension.
 *
 * Pure, DOM-free helpers: the fence-language to diagram-type mapping and
 * the markdown-it fence renderer override whose emitted HTML matches
 * `VizelDiagram.parseHTML`, so Tiptap hydrates diagram nodes directly.
 */

import type MarkdownIt from "markdown-it";
import type { VizelDiagramType } from "./diagram-render.ts";

/**
 * Map a markdown-it fence language tag to a diagram type, or `null`
 * when the language is not a diagram.
 */
function languageToDiagramType(lang: string | null | undefined): VizelDiagramType | null {
  switch ((lang ?? "").toLowerCase()) {
    case "mermaid":
      return "mermaid";
    case "dot":
    case "graphviz":
      return "graphviz";
    default:
      return null;
  }
}

/**
 * Register a markdown-it fence renderer override that emits diagram
 * HTML for `mermaid`, `dot`, and `graphviz` code blocks. The resulting
 * HTML matches `VizelDiagram.parseHTML` so Tiptap hydrates the node
 * directly without a post-parse transform.
 */
export function registerDiagramFenceRenderer(md: MarkdownIt): void {
  const fenceRule = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    const info = token?.info?.trim() ?? "";
    const lang = info.split(/\s+/)[0] ?? "";
    const diagramType = languageToDiagramType(lang);
    if (!diagramType) {
      return fenceRule
        ? fenceRule(tokens, idx, opts, env, self)
        : self.renderToken(tokens, idx, opts);
    }
    const code = token?.content ?? "";
    // Escape attribute value to keep the HTML well-formed.
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<div data-type="diagram" data-vizel-diagram="" data-diagram-type="${diagramType}" data-code="${escaped}" class="vizel-diagram"></div>`;
  };
}
