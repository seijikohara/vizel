import type { VizelMarkdownFlavor } from "@vizel/core";
import commonmarkContent from "./content-commonmark.md?raw";
import docusaurusContent from "./content-docusaurus.md?raw";
import gfmContent from "./content-gfm.md?raw";
import obsidianContent from "./content-obsidian.md?raw";

const flavorContent: Record<VizelMarkdownFlavor, string> = {
  commonmark: commonmarkContent,
  gfm: gfmContent,
  obsidian: obsidianContent,
  docusaurus: docusaurusContent,
};

/** Get demo content for a specific Markdown flavor */
export function getFlavorContent(flavor: VizelMarkdownFlavor): string {
  return flavorContent[flavor];
}

/** @deprecated Use getFlavorContent("gfm") instead */
export { default as initialMarkdown } from "./demo-content.md?raw";
