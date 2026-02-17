/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// =============================================================================
// Tiptap Re-exports (for framework packages)
// =============================================================================
export type { Editor, Extensions, JSONContent } from "@tiptap/core";
export { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
export type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";

// =============================================================================
// Auto-save
// =============================================================================
export {
  createVizelAutoSaveHandlers,
  formatVizelRelativeTime,
  getVizelStorageBackend,
  VIZEL_DEFAULT_AUTO_SAVE_OPTIONS,
  type VizelAutoSaveOptions,
  type VizelAutoSaveState,
  type VizelSaveStatus,
  type VizelStorageBackend,
} from "./auto-save.ts";

// =============================================================================
// Collaboration
// =============================================================================
export {
  createVizelCollaborationHandlers,
  VIZEL_DEFAULT_COLLABORATION_OPTIONS,
  type VizelCollaborationOptions,
  type VizelCollaborationState,
  type VizelCollaborationUser,
  type VizelYjsAwareness,
  type VizelYjsProvider,
} from "./collaboration.ts";
// =============================================================================
// Comments
// =============================================================================
export {
  createVizelCommentHandlers,
  getVizelCommentStorageBackend,
  VIZEL_DEFAULT_COMMENT_OPTIONS,
  type VizelComment,
  type VizelCommentOptions,
  type VizelCommentReply,
  type VizelCommentState,
  type VizelCommentStorage,
} from "./comment.ts";

// =============================================================================
// Extensions
// =============================================================================
export {
  // Text color
  addVizelRecentColor,
  // Callout / Admonition
  createVizelCalloutExtension,
  // Character count
  createVizelCharacterCountExtension,
  // Code block with syntax highlighting
  createVizelCodeBlockExtension,
  // Comment
  createVizelCommentExtension,
  // Embed (oEmbed, OGP)
  createVizelDefaultFetchEmbedData,
  // Details (collapsible content)
  createVizelDetailsExtensions,
  // Diagram (Mermaid, GraphViz)
  createVizelDiagramExtension,
  // Drag handle
  createVizelDragHandleExtension,
  createVizelDragHandleExtensions,
  createVizelEmbedExtension,
  // Base extensions
  createVizelExtensions,
  // File handler
  createVizelFileHandlerExtension,
  // Find & Replace
  createVizelFindReplaceExtension,
  // Image
  createVizelImageExtension,
  createVizelImageFileHandlers,
  createVizelImageUploadExtensions,
  createVizelImageUploader,
  createVizelImageUploadPlugin,
  createVizelImageUploadWithFileHandler,
  // Link
  createVizelLinkExtension,
  // Markdown
  createVizelMarkdownExtension,
  // Mathematics (KaTeX)
  createVizelMathematicsExtensions,
  // Mention
  createVizelMentionExtension,
  // Table
  createVizelTableExtensions,
  // Table of Contents
  createVizelTableOfContentsExtension,
  // Task list
  createVizelTaskListExtensions,
  createVizelTextColorExtensions,
  createVizelWikiLinkExtension,
  detectVizelEmbedProvider,
  filterVizelFilesByMimeType,
  // Slash command
  filterVizelSlashCommands,
  findVizelLanguage,
  flattenVizelSlashCommandGroups,
  type GraphvizEngine,
  getAllVizelLanguageIds,
  // Node types
  getVizelActiveNodeType,
  getVizelCommentPluginState,
  getVizelFindReplaceState,
  getVizelImageUploadPluginKey,
  getVizelRecentColors,
  getVizelRegisteredLanguages,
  // Block menu
  getVizelTurnIntoOptions,
  groupVizelBlockMenuActions,
  groupVizelSlashCommands,
  handleVizelImageDrop,
  handleVizelImagePaste,
  searchVizelSlashCommands,
  VIZEL_BLOCK_MENU_EVENT,
  VIZEL_DEFAULT_FILE_MIME_TYPES,
  VIZEL_DEFAULT_IMAGE_MAX_FILE_SIZE,
  VIZEL_HIGHLIGHT_COLORS,
  // Table controls
  VIZEL_TABLE_MENU_ITEMS,
  VIZEL_TEXT_COLORS,
  type VizelBlockMenuAction,
  type VizelBlockMenuOpenDetail,
  VizelBlockMoveKeymap,
  VizelCallout,
  type VizelCalloutOptions,
  type VizelCalloutType,
  type VizelCharacterCountOptions,
  type VizelCharacterCountStorage,
  type VizelCodeBlockLanguage,
  type VizelCodeBlockOptions,
  type VizelColorDefinition,
  VizelCommentMark,
  type VizelCommentMarkOptions,
  type VizelCommentPluginState,
  type VizelDetailsContentOptions,
  type VizelDetailsNodeOptions,
  type VizelDetailsOptions,
  type VizelDetailsSummaryOptions,
  VizelDiagram,
  type VizelDiagramOptions,
  type VizelDiagramType,
  VizelDragHandle,
  type VizelDragHandleOptions,
  VizelEmbed,
  type VizelEmbedData,
  type VizelEmbedOptions,
  type VizelEmbedProvider,
  type VizelEmbedType,
  type VizelExtensionsOptions,
  type VizelFetchEmbedDataFn,
  type VizelFileHandlerError,
  type VizelFileHandlerErrorType,
  type VizelFileHandlerOptions,
  type VizelFindMatch,
  type VizelFindReplaceOptions,
  type VizelFindReplaceState,
  VizelImage,
  type VizelImageFileHandlerOptions,
  type VizelImageFileHandlers,
  type VizelImageOptions,
  // Image resize
  VizelImageResize,
  type VizelImageResizeOptions,
  type VizelImageUploadOptions,
  type VizelImageUploadPluginOptions,
  type VizelImageUploadWithFileHandlerOptions,
  type VizelImageValidationError,
  type VizelImageValidationErrorType,
  type VizelLinkOptions,
  VizelMarkdown,
  type VizelMarkdownOptions,
  VizelMathBlock,
  type VizelMathematicsOptions,
  VizelMathInline,
  type VizelMentionItem,
  type VizelMentionOptions,
  type VizelNodeTypeOption,
  VizelResizableImage,
  type VizelResizableImageOptions,
  VizelSlashCommand,
  type VizelSlashCommandExtensionOptions,
  type VizelSlashCommandGroup,
  type VizelSlashCommandItem,
  type VizelSlashCommandRange,
  type VizelSlashCommandSearchResult,
  VizelTable,
  VizelTableCell,
  type VizelTableCellAlignment,
  type VizelTableControlsOptions,
  type VizelTableControlsUIOptions,
  VizelTableHeader,
  type VizelTableMenuItem,
  type VizelTableOfContentsOptions,
  type VizelTableOptions,
  VizelTableWithControls,
  type VizelTaskItemOptions,
  type VizelTaskListExtensionsOptions,
  type VizelTaskListOptions,
  type VizelTextColorOptions,
  type VizelTOCHeading,
  type VizelUploadImageFn,
  VizelWikiLink,
  type VizelWikiLinkOptions,
  type VizelWikiLinkSuggestion,
  validateVizelImageFile,
  vizelCommentPluginKey,
  vizelDefaultBase64Upload,
  vizelDefaultBlockMenuActions,
  vizelDefaultEmbedProviders,
  vizelDefaultGroupOrder,
  vizelDefaultNodeTypes,
  vizelDefaultSlashCommands,
  vizelEmbedPastePluginKey,
  vizelFindReplacePluginKey,
  vizelWikiLinkPluginKey,
} from "./extensions/index.ts";
// =============================================================================
// Icons
// =============================================================================
export {
  type CustomIconMap,
  getVizelIconId,
  initVizelIconRenderer,
  renderVizelIcon,
  renderVizelIconSvg,
  setVizelIconRenderer,
  type VizelBlockMenuIconName,
  type VizelBubbleMenuIconName,
  type VizelIconContextValue,
  type VizelIconName,
  type VizelIconRenderer,
  type VizelIconRendererOptions,
  type VizelIconRendererWithOptions,
  type VizelInternalIconName,
  type VizelNodeTypeIconName,
  type VizelSlashCommandIconName,
  type VizelTableIconName,
  type VizelToolbarIconName,
  type VizelUIIconName,
  vizelDefaultIconIds,
} from "./icons/index.ts";
// =============================================================================
// Plugin System
// =============================================================================
export {
  resolveVizelPluginDependencies,
  type VizelPlugin,
  VizelPluginManager,
  validateVizelPlugin,
} from "./plugin-system.ts";
// =============================================================================
// Theme
// =============================================================================
export {
  applyVizelTheme,
  createVizelSystemThemeListener,
  getStoredVizelTheme,
  getVizelSystemTheme,
  getVizelThemeInitScript,
  resolveVizelTheme,
  storeVizelTheme,
  VIZEL_DEFAULT_THEME,
  VIZEL_DEFAULT_THEME_STORAGE_KEY,
  VIZEL_THEME_DATA_ATTRIBUTE,
  type VizelResolvedTheme,
  type VizelTheme,
  type VizelThemeProviderOptions,
  type VizelThemeState,
} from "./theme.ts";
// =============================================================================
// Toolbar
// =============================================================================
export {
  groupVizelToolbarActions,
  type VizelToolbarAction,
  vizelDefaultToolbarActions,
} from "./toolbar/index.ts";
// =============================================================================
// Types
// =============================================================================
export type {
  VizelCreateEditorOptions,
  VizelEditorOptions,
  VizelEditorState,
  VizelFeatureOptions,
  VizelImageFeatureOptions,
  VizelMarkdownSyncOptions,
  VizelMarkdownSyncResult,
  VizelSlashCommandOptions,
  VizelSlashMenuRendererOptions,
} from "./types.ts";
// =============================================================================
// Utilities
// =============================================================================
export {
  type CreateVizelEditorInstanceOptions,
  type CreateVizelEditorInstanceResult,
  // Editor helpers
  convertVizelCodeBlocksToDiagrams,
  // Editor factory
  createVizelEditorInstance,
  // Error handling
  createVizelError,
  // Markdown utilities
  createVizelMarkdownSyncHandlers,
  createVizelPortalElement,
  // Suggestion container utilities
  createVizelSuggestionContainer,
  createVizelUploadEventHandler,
  // Keyboard shortcut utilities
  formatVizelShortcut,
  formatVizelTooltip,
  getVizelEditorState,
  getVizelMarkdown,
  getVizelPortalContainer,
  handleVizelSuggestionEscape,
  // Type guard utilities
  hasFunction,
  hasVizelPortalContainer,
  initializeVizelMarkdownContent,
  isOptionalString,
  isRecord,
  isString,
  isVizelError,
  isVizelMacPlatform,
  // Color utilities
  isVizelValidHexColor,
  mountToVizelPortal,
  normalizeVizelHexColor,
  parseVizelMarkdown,
  registerVizelUploadEventHandler,
  removeVizelPortalContainer,
  resolveVizelFeatures,
  // Markdown flavor utilities
  resolveVizelFlavorConfig,
  setVizelMarkdown,
  // Text highlight utilities
  splitVizelTextByMatches,
  transformVizelDiagramCodeBlocks,
  unmountFromVizelPortal,
  VIZEL_DEFAULT_FLAVOR,
  VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS,
  VIZEL_PORTAL_ID,
  VIZEL_PORTAL_Z_INDEX,
  VIZEL_SUGGESTION_Z_INDEX,
  VIZEL_UPLOAD_IMAGE_EVENT,
  type VizelCalloutMarkdownFormat,
  type VizelContentNode,
  type VizelCreateUploadEventHandlerOptions,
  type VizelDOMRectGetter,
  VizelError,
  type VizelErrorCode,
  type VizelFlavorConfig,
  type VizelMarkdownSyncHandlers,
  type VizelMountPortalOptions,
  type VizelPortalLayer,
  type VizelResolveFeaturesOptions,
  type VizelSuggestionContainer,
  type VizelTextSegment,
  vizelDefaultEditorProps,
  type WrapAsVizelErrorOptions,
  wrapAsVizelError,
} from "./utils/index.ts";
// Re-export VizelMarkdownFlavor type from markdown-flavors utility
export type { VizelMarkdownFlavor } from "./utils/markdown-flavors.ts";
// =============================================================================
// Version History
// =============================================================================
export {
  createVizelVersionHistoryHandlers,
  getVizelVersionStorageBackend,
  VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS,
  type VizelVersionHistoryOptions,
  type VizelVersionHistoryState,
  type VizelVersionSnapshot,
  type VizelVersionStorage,
} from "./version-history.ts";
