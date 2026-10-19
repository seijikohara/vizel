import {
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "../markdown/flavors/index.ts";
import type { VizelMarkdownFlavor } from "../markdown/types.ts";

/**
 * Markdown flavor configuration consumed by extensions that need
 * flavor-specific serialization tuning (callout output style,
 * wiki-link bracket style).
 */
export interface VizelFlavorConfig {
  /** How callout / admonition blocks are serialized. */
  calloutFormat: VizelCalloutMarkdownFormat;
  /** Whether wiki links are serialized as `[[page]]` (true) or standard links (false). */
  wikiLinkSerialize: boolean;
}

/** Callout / admonition output format for Markdown serialization. */
export type VizelCalloutMarkdownFormat =
  | "github-alerts"
  | "obsidian-callouts"
  | "directives"
  | "blockquote-fallback";

const VIZEL_CALLOUT_MARKDOWN_FORMATS: readonly string[] = [
  "github-alerts",
  "obsidian-callouts",
  "directives",
  "blockquote-fallback",
] satisfies readonly VizelCalloutMarkdownFormat[];

const isVizelCalloutMarkdownFormat = (value: unknown): value is VizelCalloutMarkdownFormat =>
  typeof value === "string" && VIZEL_CALLOUT_MARKDOWN_FORMATS.includes(value);

/** Default Markdown flavor (GitHub Flavored Markdown). */
export const VIZEL_DEFAULT_FLAVOR: VizelMarkdownFlavor = vizelGfmFlavor;

const DEFAULT_FLAVOR_CONFIG: VizelFlavorConfig = {
  calloutFormat: "blockquote-fallback",
  wikiLinkSerialize: false,
};

/**
 * Resolve the {@link VizelFlavorConfig} carried inside a flavor's
 * `config` field.
 *
 * Falls back to CommonMark-equivalent defaults when the flavor does
 * not declare these settings.
 */
export function resolveVizelFlavorConfig(
  flavor: VizelMarkdownFlavor = VIZEL_DEFAULT_FLAVOR
): VizelFlavorConfig {
  const configuredCalloutFormat = flavor.config?.calloutFormat;
  const calloutFormat = isVizelCalloutMarkdownFormat(configuredCalloutFormat)
    ? configuredCalloutFormat
    : DEFAULT_FLAVOR_CONFIG.calloutFormat;
  const configuredWikiLinkSerialize = flavor.config?.wikiLinkSerialize;
  const wikiLinkSerialize =
    typeof configuredWikiLinkSerialize === "boolean"
      ? configuredWikiLinkSerialize
      : DEFAULT_FLAVOR_CONFIG.wikiLinkSerialize;
  return { calloutFormat, wikiLinkSerialize };
}

// Surface the built-in flavors here so import sites that pull from
// `utils/markdown-flavors.ts` keep working alongside the `@vizel/core`
// root re-exports without chasing a separate module path.
export {
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
};
