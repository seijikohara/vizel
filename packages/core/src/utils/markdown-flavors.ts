/**
 * Markdown flavor definitions and resolution utilities.
 *
 * Vizel supports multiple Markdown output flavors while parsing all formats tolerantly.
 * The flavor setting only affects serialization (output); input parsing accepts all formats.
 */

/**
 * Supported Markdown output flavors.
 *
 * | Flavor | Callout Output | WikiLinks | Platforms |
 * |--------|---------------|-----------|-----------|
 * | `commonmark` | Blockquote fallback | No | SO, Reddit, email |
 * | `gfm` | `> [!NOTE]` | No | GitHub, GitLab, DEV.to |
 * | `obsidian` | `> [!note]` | `[[page]]` | Obsidian, Logseq, Foam |
 * | `docusaurus` | `:::note` | No | Docusaurus, VitePress, Zenn, Qiita |
 */
export type VizelMarkdownFlavor = "commonmark" | "gfm" | "obsidian" | "docusaurus";

/** Callout/admonition output format for Markdown serialization */
export type VizelCalloutMarkdownFormat =
  | "github-alerts"
  | "obsidian-callouts"
  | "directives"
  | "blockquote-fallback";

/**
 * Flavor-specific configuration resolved from a {@link VizelMarkdownFlavor}.
 * Used internally by extensions to determine how to serialize Markdown.
 */
export interface VizelFlavorConfig {
  /** How callout/admonition blocks are serialized */
  calloutFormat: VizelCalloutMarkdownFormat;
  /** Whether wiki links are serialized as `[[page]]` (true) or standard links (false) */
  wikiLinkSerialize: boolean;
}

/** Default Markdown flavor */
export const VIZEL_DEFAULT_FLAVOR: VizelMarkdownFlavor = "gfm";

const FLAVOR_CONFIGS = {
  commonmark: {
    calloutFormat: "blockquote-fallback",
    wikiLinkSerialize: false,
  },
  gfm: {
    calloutFormat: "github-alerts",
    wikiLinkSerialize: false,
  },
  obsidian: {
    calloutFormat: "obsidian-callouts",
    wikiLinkSerialize: true,
  },
  docusaurus: {
    calloutFormat: "directives",
    wikiLinkSerialize: false,
  },
} as const satisfies Record<VizelMarkdownFlavor, VizelFlavorConfig>;

/**
 * Resolve flavor-specific configuration from a Markdown flavor name.
 *
 * @param flavor - The Markdown flavor to resolve. Defaults to `"gfm"`.
 * @returns Flavor configuration for extension serialization.
 *
 * @example
 * ```typescript
 * const config = resolveVizelFlavorConfig("obsidian");
 * // config.calloutFormat === "obsidian-callouts"
 * // config.wikiLinkSerialize === true
 * ```
 */
export function resolveVizelFlavorConfig(
  flavor: VizelMarkdownFlavor = VIZEL_DEFAULT_FLAVOR
): VizelFlavorConfig {
  return FLAVOR_CONFIGS[flavor];
}
