import type { VizelMarkdownFlavor } from "../types.ts";

/**
 * Obsidian-style Markdown.
 *
 * Targets Obsidian, Logseq, Foam, and similar wiki-style note systems.
 * Callouts emit Obsidian's `> [!note]` block syntax; wiki-links emit
 * the `[[page]]` form rather than inline markdown links.
 */
export const vizelObsidianFlavor: VizelMarkdownFlavor = {
  name: "obsidian",
  config: {
    calloutFormat: "obsidian-callouts",
    wikiLinkSerialize: true,
  },
};
