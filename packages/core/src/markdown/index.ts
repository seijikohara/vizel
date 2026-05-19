// VizelMarkdownFlavor as a first-class plugin type (Section 10).
export {
  composeVizelMarkdownFlavors,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
} from "./flavors/index.ts";
export type {
  VizelMarkdownEncodingOptions,
  VizelMarkdownFlavor,
  VizelMarkdownItInstance,
  VizelMarkdownLossyEncodingMode,
  VizelMarkSerializer,
  VizelNodeSerializer,
} from "./types.ts";
