// Editor helpers

// Portal utilities (relocated to controllers/ in v2.0.0 Section 1; re-exported here for compat)
export {
  createVizelPortalElement,
  getVizelPortalContainer,
  hasVizelPortalContainer,
  mountToVizelPortal,
  removeVizelPortalContainer,
  unmountFromVizelPortal,
  VIZEL_PORTAL_ID,
  VIZEL_PORTAL_Z_INDEX,
  type VizelMountPortalOptions,
  type VizelPortalLayer,
} from "../controllers/portal.ts";
// Suggestion container utilities (relocated to controllers/ in v2.0.0 Section 1; re-exported here for compat)
export {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  VIZEL_SUGGESTION_Z_INDEX,
  type VizelDOMRectGetter,
  type VizelSuggestionContainer,
} from "../controllers/suggestionContainer.ts";
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
// Collection utilities
export { groupByConsecutiveField } from "./groupByField.ts";
// Keyboard shortcut utilities
export { formatVizelShortcut, formatVizelTooltip, isVizelMacPlatform } from "./keyboard.ts";
// Keyboard navigation (pure resolvers for 1D and 2D lists)
export {
  resolveVizelGridNavigation,
  resolveVizelListNavigation,
} from "./keyboard-navigation.ts";
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
// Menu positioning utilities
export { clampMenuPosition, type MenuPosition, shouldFlipSubmenu } from "./menuPositioning.ts";
// Minimap canvas rendering
export {
  renderVizelMinimapToCanvas,
  type VizelMinimapRenderOptions,
} from "./minimap-render.ts";
// Text highlight utilities
export { splitVizelTextByMatches, type VizelTextSegment } from "./textHighlight.ts";
// Type guard utilities
export { hasFunction, isOptionalString, isRecord, isString } from "./typeGuards.ts";
