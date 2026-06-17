// Editor helpers

// Block path utilities
export { getVizelBlockPath, type VizelBlockPathSegment } from "./block-path.ts";
// Color utilities
export { isVizelValidHexColor, normalizeVizelHexColor } from "./colorUtils.ts";
// Curated default feature set
export { vizelDefaultFeatures } from "./default-features.ts";
// Editor factory
export {
  type CreateVizelEditorInstanceOptions,
  type CreateVizelEditorInstanceResult,
  createVizelEditorInstance,
} from "./editorFactory.ts";
export {
  convertVizelCodeBlocksToDiagrams,
  createVizelUploadEventHandler,
  getVizelEditorState,
  mountVizelEditorView,
  registerVizelUploadEventHandler,
  resolveVizelFeatures,
  transformVizelDiagramCodeBlocks,
  VIZEL_UPLOAD_IMAGE_EVENT,
  type VizelContentNode,
  type VizelCreateUploadEventHandlerOptions,
  type VizelResolveFeaturesOptions,
  vizelDefaultEditorProps,
} from "./editorHelpers.ts";
// Shallow-equality helpers used by selector-based reactivity layers.
export { shallowEqualArray, shallowEqualObject } from "./equality.ts";
// Error handling utilities
export {
  createVizelError,
  emitVizelError,
  isVizelError,
  VizelError,
  type VizelErrorCode,
  type VizelErrorOptions,
  type VizelErrorSeverity,
  type WrapAsVizelErrorOptions,
  wrapAsVizelError,
} from "./errorHandling.ts";
// Keyboard shortcut utilities
export { formatVizelShortcut, formatVizelTooltip, isVizelMacPlatform } from "./keyboard.ts";
// Lazy import utility
export { createLazyLoader } from "./lazy-import.ts";
// Markdown utilities
export {
  createVizelMarkdownSyncHandlers,
  getVizelMarkdown,
  initializeVizelMarkdownContent,
  parseVizelMarkdown,
  setVizelMarkdown,
  VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS,
  type VizelMarkdownSyncHandlers,
} from "./markdown.ts";
// Markdown flavor utilities
export {
  resolveVizelFlavorConfig,
  VIZEL_DEFAULT_FLAVOR,
  type VizelCalloutMarkdownFormat,
  type VizelFlavorConfig,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "./markdown-flavors.ts";
// Submenu flip utility
export { shouldFlipSubmenu } from "./menuPositioning.ts";
// SSR-safe rAF helpers (used by markdown sync hooks)
export {
  vizelCancelAnimationFrame,
  vizelRequestAnimationFrame,
} from "./raf.ts";
// SSR utilities
export {
  type VizelThemeInitScriptOptions,
  vizelThemeInitScript,
} from "./ssr.ts";
// Text highlight utilities
export { splitVizelTextByMatches, type VizelTextSegment } from "./textHighlight.ts";
