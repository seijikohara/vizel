/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

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
// Extensions
// =============================================================================
export {
  // Text color
  addVizelRecentColor,
  // Character count
  createVizelCharacterCountExtension,
  // Code block with syntax highlighting
  createVizelCodeBlockExtension,
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
  // Table
  createVizelTableExtensions,
  // Task list
  createVizelTaskListExtensions,
  createVizelTextColorExtensions,
  type DragHandleOptions,
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
  getVizelImageUploadPluginKey,
  getVizelRecentColors,
  getVizelRegisteredLanguages,
  groupVizelSlashCommands,
  handleVizelImageDrop,
  handleVizelImagePaste,
  type ImageUploadOptions,
  searchVizelSlashCommands,
  VIZEL_DEFAULT_FILE_MIME_TYPES,
  VIZEL_HIGHLIGHT_COLORS,
  // Table controls
  VIZEL_TABLE_MENU_ITEMS,
  VIZEL_TEXT_COLORS,
  VizelBlockMoveKeymap,
  type VizelCharacterCountOptions,
  type VizelCharacterCountStorage,
  type VizelCodeBlockLanguage,
  type VizelCodeBlockOptions,
  type VizelColorDefinition,
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
  VizelImage,
  type VizelImageFileHandlerOptions,
  type VizelImageFileHandlers,
  type VizelImageOptions,
  // Image resize
  VizelImageResize,
  type VizelImageResizeOptions,
  type VizelImageUploadOptions,
  type VizelImageUploadWithFileHandlerOptions,
  type VizelImageValidationError,
  type VizelImageValidationErrorType,
  type VizelLinkOptions,
  VizelMarkdown,
  type VizelMarkdownOptions,
  VizelMathBlock,
  type VizelMathematicsOptions,
  VizelMathInline,
  type VizelNodeTypeOption,
  VizelResizableImage,
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
  type VizelTableOptions,
  VizelTableWithControls,
  type VizelTaskItemOptions,
  type VizelTaskListExtensionsOptions,
  type VizelTaskListOptions,
  type VizelTextColorOptions,
  type VizelUploadImageFn,
  validateVizelImageFile,
  vizelDefaultBase64Upload,
  vizelDefaultEmbedProviders,
  vizelDefaultGroupOrder,
  vizelDefaultNodeTypes,
  vizelDefaultSlashCommands,
  vizelEmbedPastePluginKey,
} from "./extensions/index.ts";

// =============================================================================
// Icons
// =============================================================================
export {
  getVizelIconId,
  renderVizelIcon,
  setVizelIconRenderer,
  type VizelBubbleMenuIconName,
  type VizelIconName,
  type VizelIconRenderer,
  type VizelIconRendererOptions,
  type VizelIconRendererWithOptions,
  type VizelInternalIconName,
  type VizelNodeTypeIconName,
  type VizelSlashCommandIconName,
  type VizelTableIconName,
  type VizelUIIconName,
  vizelDefaultIconIds,
} from "./icons/index.ts";

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
// Types
// =============================================================================
export type {
  VizelEditorOptions,
  VizelEditorState,
  VizelFeatureOptions,
  VizelImageFeatureOptions,
  VizelMarkdownSyncOptions,
  VizelMarkdownSyncResult,
  VizelSlashCommandOptions,
} from "./types.ts";

// =============================================================================
// Utilities
// =============================================================================
export {
  // Editor helpers
  convertVizelCodeBlocksToDiagrams,
  convertVizelMermaidCodeBlocksToDiagrams,
  // Markdown utilities
  createVizelMarkdownSyncHandlers,
  createVizelPortalElement,
  createVizelUploadEventHandler,
  getVizelEditorState,
  getVizelMarkdown,
  getVizelPortalContainer,
  hasVizelPortalContainer,
  initializeVizelMarkdownContent,
  mountToVizelPortal,
  parseVizelMarkdown,
  registerVizelUploadEventHandler,
  removeVizelPortalContainer,
  resolveVizelFeatures,
  setVizelMarkdown,
  transformVizelDiagramCodeBlocks,
  transformVizelMermaidToDiagram,
  unmountFromVizelPortal,
  VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS,
  VIZEL_PORTAL_ID,
  VIZEL_PORTAL_Z_INDEX,
  VIZEL_UPLOAD_IMAGE_EVENT,
  type VizelContentNode,
  type VizelCreateUploadEventHandlerOptions,
  type VizelMarkdownSyncHandlers,
  type VizelMountPortalOptions,
  type VizelPortalLayer,
  type VizelResolveFeaturesOptions,
  vizelDefaultEditorProps,
} from "./utils/index.ts";
