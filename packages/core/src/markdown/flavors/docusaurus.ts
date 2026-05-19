import type { VizelMarkdownFlavor } from "../types.ts";

/**
 * Docusaurus / VitePress / Zenn / Qiita flavor.
 *
 * Targets static-site generators that consume the `:::note` / `:::tip`
 * admonition directive syntax. Callouts emit directive blocks;
 * wiki-links fall back to inline markdown links because the directive
 * ecosystems have no canonical `[[page]]` form.
 */
export const vizelDocusaurusFlavor: VizelMarkdownFlavor = {
  name: "docusaurus",
  config: {
    calloutFormat: "directives",
    wikiLinkSerialize: false,
  },
};
