// VizelMarkdownFlavor as a first-class plugin type.
export {
  composeVizelMarkdownFlavors,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "./flavors/index.ts";
export { assertMarkdownRoundtrip, type VizelRoundtripSample } from "./roundtrip.ts";
export type {
  VizelMarkdownEncodingOptions,
  VizelMarkdownFlavor,
  VizelMarkdownItInstance,
  VizelMarkdownLossyEncodingMode,
  VizelMarkSerializer,
  VizelNodeSerializer,
} from "./types.ts";
