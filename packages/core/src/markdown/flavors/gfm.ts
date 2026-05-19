import type { VizelMarkdownFlavor } from "../types.ts";

/**
 * GitHub Flavored Markdown.
 *
 * Configured for GitHub, GitLab, and similar consumers: callouts use
 * the `> [!NOTE]` alert syntax and tables and task lists are
 * expected. Wiki-links fall back to inline markdown links because GFM
 * has no canonical `[[page]]` syntax.
 *
 * The flavor does not register parser plugins because tables and
 * task lists are recognized by the core markdown-it preset; alert
 * blocks are handled at the serializer layer.
 */
export const vizelGfmFlavor: VizelMarkdownFlavor = {
  name: "gfm",
  config: {
    calloutFormat: "github-alerts",
    wikiLinkSerialize: false,
  },
};
