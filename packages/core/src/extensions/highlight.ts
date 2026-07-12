import type { Extensions } from "@tiptap/core";
import { Highlight } from "@tiptap/extension-highlight";

import type { VizelColorDefinition } from "./text-color.ts";

/**
 * Options for the highlight extension.
 *
 * The highlight palette and the multicolor flag live here rather than on
 * `VizelTextColorOptions` so that consumers can configure text color and
 * highlight independently through `features.content.textColor` and
 * `features.content.highlight`.
 */
export interface VizelHighlightOptions {
  /** Custom highlight color palette */
  highlightColors?: readonly VizelColorDefinition[];
  /** Allow any CSS color value (default: true) */
  multicolor?: boolean;
}

/**
 * Create the highlight mark extension.
 *
 * The highlight palette (`VIZEL_HIGHLIGHT_COLORS`) and palette helpers
 * (`getVizelRecentColors("highlight")`, `addVizelRecentColor("highlight",
 * ...)`, `applyVizelColorToEditor(editor, "highlight", color)`) continue
 * to live in `text-color.ts` because the color picker UI consumes both
 * text color and highlight palettes from the same module.
 */
export function createVizelHighlightExtension(options: VizelHighlightOptions = {}): Extensions {
  const { multicolor = true } = options;
  return [Highlight.configure({ multicolor })];
}
