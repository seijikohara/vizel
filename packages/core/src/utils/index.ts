// Editor helpers

// Color utilities
export { isVizelValidHexColor, normalizeVizelHexColor } from "./colorUtils.ts";
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
  isVizelError,
  VizelError,
  type VizelErrorCode,
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
  type VizelMarkdownFlavor,
} from "./markdown-flavors.ts";
// Portal utilities
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
} from "./portal.ts";
// Suggestion container utilities
export {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  VIZEL_SUGGESTION_Z_INDEX,
  type VizelDOMRectGetter,
  type VizelSuggestionContainer,
} from "./suggestionContainer.ts";
// Text highlight utilities
export { splitVizelTextByMatches, type VizelTextSegment } from "./textHighlight.ts";
// Type guard utilities
export { hasFunction, isOptionalString, isRecord, isString } from "./typeGuards.ts";
