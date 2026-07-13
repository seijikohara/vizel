import type { VizelMarkdownFlavor } from "@vizel/core";

import commonmarkContent from "./content-commonmark.md?raw";
import docusaurusContent from "./content-docusaurus.md?raw";
import gfmContent from "./content-gfm.md?raw";
import obsidianContent from "./content-obsidian.md?raw";

const flavorContentByName: Record<string, string> = {
  commonmark: commonmarkContent,
  gfm: gfmContent,
  obsidian: obsidianContent,
  docusaurus: docusaurusContent,
};

/** Return demo content matching the given Markdown flavor. */
export function getFlavorContent(flavor: VizelMarkdownFlavor): string {
  return flavorContentByName[flavor.name] ?? gfmContent;
}
