import type { VizelMarkdownFlavor } from "../types.ts";

/**
 * CommonMark flavor — the lowest-common-denominator spec.
 *
 * No optional extensions are registered, so authors that want their
 * output to render correctly on Stack Overflow, Reddit, email
 * clients, and other strict-CommonMark consumers should choose this
 * flavor.
 *
 * Callouts fall back to plain blockquotes; wiki-links fall back to
 * inline markdown links. See {@link vizelGfmFlavor} for
 * GitHub-flavored output.
 */
export const vizelCommonMarkFlavor: VizelMarkdownFlavor = {
  name: "commonmark",
  config: {
    calloutFormat: "blockquote-fallback",
    wikiLinkSerialize: false,
  },
};
