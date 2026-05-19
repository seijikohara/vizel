import deflist from "markdown-it-deflist";
import footnote from "markdown-it-footnote";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import type { VizelMarkdownFlavor, VizelMarkdownItInstance } from "../types.ts";

/**
 * Pandoc-flavored Markdown.
 *
 * Targets Pandoc-compatible consumers (academic publishing, RMarkdown,
 * Quarto). Registers the markdown-it plugin set that mirrors Pandoc's
 * extension surface most commonly relied upon: definition lists,
 * footnotes, subscript, and superscript.
 *
 * Callouts fall back to plain blockquotes because Pandoc has no
 * canonical admonition syntax; wiki-links fall back to inline
 * markdown links for the same reason.
 */
export const vizelPandocFlavor: VizelMarkdownFlavor = {
  name: "pandoc",
  markdownItPlugins: [
    (md: VizelMarkdownItInstance) => {
      md.use(deflist);
    },
    (md: VizelMarkdownItInstance) => {
      md.use(footnote);
    },
    (md: VizelMarkdownItInstance) => {
      md.use(sub);
    },
    (md: VizelMarkdownItInstance) => {
      md.use(sup);
    },
  ],
  config: {
    calloutFormat: "blockquote-fallback",
    wikiLinkSerialize: false,
  },
};
