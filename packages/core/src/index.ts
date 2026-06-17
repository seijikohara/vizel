/// <reference path="./env.d.ts" />

/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// Side-effect import: augment `@tiptap/core`'s Editor with the always-on
// `getMarkdown()` / `markdown.parse(md)` surface. Must load before any
// consumer touches the augmented members.
import "./markdown/augment.ts";

// =============================================================================
// Tiptap Re-exports (for framework packages)
// =============================================================================
// Re-export the Tiptap symbols that adapters need. Consumers can install
// only one Vizel framework package and import these without adding
// @tiptap/core to their dependencies.
export type {
  ChainedCommands,
  Editor,
  Extensions,
  JSONContent,
  Range,
} from "@tiptap/core";
export { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
export type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";

// =============================================================================
// Auto-save
// =============================================================================
export {
  createVizelAutoSaveHandlers,
  formatVizelRelativeTime,
  getVizelStorageBackend,
  resolveVizelSaveIndicatorView,
  VIZEL_DEFAULT_AUTO_SAVE_OPTIONS,
  type VizelAutoSaveOptions,
  type VizelAutoSaveState,
  type VizelSaveIndicatorView,
  type VizelSaveStatus,
  type VizelStorageBackend,
} from "./auto-save.ts";
// =============================================================================
// Builders
// =============================================================================
export {
  applyVizelLinkEdit,
  buildVizelBlockMenuSpec,
  buildVizelBlockMenuSpecFromCommands,
  buildVizelBubbleMenuSpec,
  buildVizelFindReplaceSpec,
  buildVizelFindReplaceSpecFromLocale,
  buildVizelLinkEditorSpec,
  buildVizelMentionMenuSpec,
  buildVizelNodeSelectorSpec,
  buildVizelOutlineSpec,
  buildVizelSlashMenuSpecFromCommands,
  buildVizelToolbarDropdownSpec,
  buildVizelToolbarSpec,
  getNextVizelSlashMenuGroupIndex,
  resolveVizelLinkEditorLabels,
  type VizelBlockMenuFromCommandsOptions,
  type VizelBlockMenuItemView,
  type VizelBlockMenuSpec,
  type VizelBlockMenuSubmenuTriggerSpec,
  type VizelBlockMenuTurnIntoItemView,
  type VizelBubbleMenuSpecOptions,
  type VizelCommandSpec,
  type VizelFindReplaceSpec,
  type VizelFormFieldAttrs,
  type VizelFormFieldSpec,
  type VizelFormRootAttrs,
  type VizelFormSpec,
  type VizelGridCellAttrs,
  type VizelGridCellSpec,
  type VizelGridRootAttrs,
  type VizelGridSpec,
  type VizelLinkEditorLabels,
  type VizelLinkEditorSpec,
  type VizelLinkSubmitParams,
  type VizelMentionItemView,
  type VizelMenuItemAttrs,
  type VizelMenuItemSpec,
  type VizelMenuRootAttrs,
  type VizelMenuSectionSpec,
  type VizelMenuSpec,
  type VizelNodeSelectorItemView,
  type VizelNodeSelectorSpec,
  type VizelNodeSelectorTriggerSpec,
  type VizelOutlineItemSpec,
  type VizelOutlineSpec,
  type VizelPopoverBodySpec,
  type VizelPopoverSpec,
  type VizelPopoverTriggerSpec,
  type VizelShortcutSpec,
  type VizelSlashMenuFromCommandsOptions,
  type VizelToolbarDropdownItemView,
  type VizelToolbarDropdownSpec,
  type VizelToolbarDropdownTriggerSpec,
  type VizelToolbarSpecOptions,
} from "./builders/index.ts";
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
export type { VizelCollaborationProvider } from "./collaboration-provider.ts";
// =============================================================================
// Commands (VizelCommand unified abstraction)
// =============================================================================
export {
  deriveVizelCommandSpec,
  type VizelCommand,
  type VizelCommandSurfaceSet,
  type VizelShortcut,
  vizelBlockCommands,
  vizelBlockOperationCommands,
  vizelCommandsFromNodeTypes,
  vizelDefaultCommands,
  vizelFormatCommands,
  vizelInsertCommands,
} from "./commands/index.ts";
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
// Controllers
// =============================================================================
export {
  createVizelBlockMenuTriggerController,
  createVizelBubbleMenuEscapeController,
  createVizelEditorSubscription,
  createVizelEditorTransactionStore,
  createVizelPopoverController,
  createVizelRelativeTimeTicker,
  createVizelSystemThemeListener,
  type VizelBlockMenuTriggerController,
  type VizelBlockMenuTriggerControllerOptions,
  type VizelBubbleMenuEscapeController,
  type VizelBubbleMenuEscapeControllerOptions,
  type VizelEditorEventName,
  type VizelEditorSubscriptionOptions,
  type VizelEditorTransactionStore,
  type VizelPopoverController,
  type VizelPopoverControllerOptions,
  type VizelPopoverPlacement,
  type VizelRelativeTimeTicker,
  type VizelRelativeTimeTickerOptions,
  type VizelSystemThemeListener,
} from "./controllers/index.ts";
// Portal controller: shared layered overlay container for adapter portals.
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
} from "./controllers/portal.ts";
// Suggestion container controller: positioned container for slash and mention menus.
export {
  createVizelSuggestionContainer,
  handleVizelSuggestionEscape,
  VIZEL_SUGGESTION_Z_INDEX,
  type VizelDOMRectGetter,
  type VizelSuggestionContainer,
} from "./controllers/suggestionContainer.ts";
// =============================================================================
// Extensions
// =============================================================================
export {
  // Text color
  addVizelRecentColor,
  applyVizelColorToEditor,
  // Block-aware clipboard
  createVizelBlockClipboardExtension,
  // Block menu (locale-aware)
  createVizelBlockMenuActions,
  // Callout / Admonition
  createVizelCalloutExtension,
  // Character count
  createVizelCharacterCountExtension,
  // Code block with syntax highlighting
  createVizelCodeBlockExtension,
  // Command shortcuts
  createVizelCommandShortcutsExtension,
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
  // Highlight
  createVizelHighlightExtension,
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
  // Multi-block range selection
  createVizelMultiBlockSelectionExtension,
  // Node types (locale-aware)
  createVizelNodeTypes,
  createVizelPresenceExtension,
  // Table
  createVizelTableExtensions,
  // Table of Contents
  createVizelTableOfContentsExtension,
  // Task list
  createVizelTaskListExtensions,
  createVizelTextColorExtensions,
  createVizelTypographyExtension,
  createVizelWikiLinkExtension,
  detectVizelEmbedProvider,
  filterVizelFilesByMimeType,
  findVizelLanguage,
  type GraphvizEngine,
  getAllVizelLanguageIds,
  getVizelActiveNodeType,
  getVizelCommentPluginState,
  getVizelFindReplaceState,
  getVizelImageUploadPluginKey,
  getVizelMultiBlockSelectionState,
  getVizelRecentColors,
  getVizelRegisteredLanguages,
  // Slash command
  getVizelSlashCommandLocale,
  // Block menu
  getVizelTurnIntoOptions,
  groupVizelBlockMenuActions,
  handleVizelImageDrop,
  handleVizelImagePaste,
  loadVizelEmbedScripts,
  resolveVizelEmbedView,
  VIZEL_BLOCK_MENU_EVENT,
  VIZEL_DEFAULT_FILE_MIME_TYPES,
  VIZEL_DEFAULT_IMAGE_MAX_FILE_SIZE,
  VIZEL_HIGHLIGHT_COLORS,
  // Table controls
  VIZEL_TABLE_MENU_ITEMS,
  VIZEL_TEXT_COLORS,
  type VizelBlockClipboardOptions,
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
  type VizelCommandShortcutsOptions,
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
  type VizelEmbedViewModel,
  type VizelExtensionsOptions,
  type VizelFetchEmbedDataFn,
  type VizelFileHandlerError,
  type VizelFileHandlerErrorType,
  type VizelFileHandlerOptions,
  type VizelFindMatch,
  type VizelFindReplaceOptions,
  type VizelFindReplaceState,
  type VizelHighlightOptions,
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
  type VizelMultiBlockSelectionOptions,
  type VizelMultiBlockSelectionState,
  type VizelNodeTypeOption,
  type VizelPresenceAwareness,
  type VizelPresenceOptions,
  type VizelPresenceUser,
  type VizelPresenceUserState,
  VizelResizableImage,
  type VizelResizableImageOptions,
  VizelSlashCommand,
  type VizelSlashCommandExtensionOptions,
  type VizelSlashCommandStorage,
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
  type VizelTypographyOptions,
  type VizelUploadImageFn,
  VizelWikiLink,
  type VizelWikiLinkOptions,
  type VizelWikiLinkSuggestion,
  validateVizelImageFile,
  vizelBlockClipboardPluginKey,
  vizelCommentPluginKey,
  vizelDefaultBase64Upload,
  vizelDefaultBlockMenuActions,
  vizelDefaultEmbedProviders,
  vizelDefaultNodeTypes,
  vizelDefaultSlashMenuCommands,
  vizelEmbedPastePluginKey,
  vizelFindReplacePluginKey,
  vizelMultiBlockSelectionPluginKey,
  vizelPresencePluginKey,
  vizelWikiLinkPluginKey,
} from "./extensions/index.ts";
// =============================================================================
// Feature Manifest (cross-framework parity SSOT)
// =============================================================================
export {
  VIZEL_FEATURE_MANIFEST,
  type VizelAdapterSymbol,
  type VizelAriaContract,
  type VizelFeatureAdapters,
  type VizelFeatureCategory,
  type VizelFeatureDefinition,
  type VizelFeatureId,
  type VizelKeyboardMap,
} from "./feature-manifest.ts";
// =============================================================================
// i18n
// =============================================================================
export {
  createVizelLocale,
  formatRelativeTimeWithLocale,
  resolveVizelFindReplaceLabels,
  type SlashItemText,
  type VizelLocale,
  type VizelLocalePartial,
  vizelEnLocale,
} from "./i18n/index.ts";
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
// Markdown flavor plugin types
// =============================================================================
export {
  assertMarkdownRoundtrip,
  composeVizelMarkdownFlavors,
  type VizelMarkdownEncodingOptions,
  type VizelMarkdownFlavor,
  type VizelMarkdownItInstance,
  type VizelMarkdownLossyEncodingMode,
  type VizelMarkSerializer,
  type VizelNodeSerializer,
  type VizelRoundtripSample,
} from "./markdown/index.ts";
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
  createVizelBubbleMenuActions,
  createVizelToolbarActions,
  filterVizelBubbleMenuActions,
  groupVizelBubbleMenuActions,
  groupVizelToolbarActions,
  isVizelToolbarDropdownAction,
  type VizelBubbleMenuAction,
  type VizelToolbarAction,
  type VizelToolbarActionItem,
  type VizelToolbarDropdownAction,
  vizelDefaultBubbleMenuActions,
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
  VizelSuggestionRendererOptions,
} from "./types.ts";
// =============================================================================
// Utilities
// =============================================================================
export {
  type CreateVizelEditorInstanceOptions,
  type CreateVizelEditorInstanceResult,
  // Editor helpers
  convertVizelCodeBlocksToDiagrams,
  // Lazy import utility
  createLazyLoader,
  // Editor factory
  createVizelEditorInstance,
  // Error handling
  createVizelError,
  // Markdown utilities
  createVizelMarkdownSyncHandlers,
  createVizelUploadEventHandler,
  emitVizelError,
  // Keyboard shortcut utilities
  formatVizelShortcut,
  formatVizelTooltip,
  // Block path utility
  getVizelBlockPath,
  getVizelEditorState,
  getVizelMarkdown,
  initializeVizelMarkdownContent,
  isVizelError,
  isVizelMacPlatform,
  // Color utilities
  isVizelValidHexColor,
  mountVizelEditorView,
  normalizeVizelHexColor,
  parseVizelMarkdown,
  registerVizelUploadEventHandler,
  resolveVizelFeatures,
  // Markdown flavor utilities
  resolveVizelFlavorConfig,
  setVizelMarkdown,
  // Shallow-equality helpers used by selector-based reactivity layers.
  shallowEqualArray,
  shallowEqualObject,
  shouldFlipSubmenu,
  // Text highlight utilities
  splitVizelTextByMatches,
  transformVizelDiagramCodeBlocks,
  VIZEL_DEFAULT_FLAVOR,
  VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS,
  VIZEL_UPLOAD_IMAGE_EVENT,
  type VizelBlockPathSegment,
  type VizelCalloutMarkdownFormat,
  type VizelContentNode,
  type VizelCreateUploadEventHandlerOptions,
  VizelError,
  type VizelErrorCode,
  type VizelErrorOptions,
  type VizelErrorSeverity,
  type VizelFlavorConfig,
  type VizelMarkdownSyncHandlers,
  type VizelResolveFeaturesOptions,
  type VizelTextSegment,
  // SSR utilities
  type VizelThemeInitScriptOptions,
  vizelCancelAnimationFrame,
  vizelCommonMarkFlavor,
  vizelDefaultEditorProps,
  vizelDefaultFeatures,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
  vizelRequestAnimationFrame,
  vizelThemeInitScript,
  type WrapAsVizelErrorOptions,
  wrapAsVizelError,
} from "./utils/index.ts";
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
