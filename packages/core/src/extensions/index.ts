// Base extensions
export { createVizelExtensions, type VizelExtensionsOptions } from "./base.ts";
// Callout / Admonition
export {
  createVizelCalloutExtension,
  VizelCallout,
  type VizelCalloutOptions,
  type VizelCalloutType,
} from "./callout.ts";
// Character count
export {
  createVizelCharacterCountExtension,
  type VizelCharacterCountOptions,
  type VizelCharacterCountStorage,
} from "./character-count.ts";
// Code block with syntax highlighting
export {
  createVizelCodeBlockExtension,
  findVizelLanguage,
  getAllVizelLanguageIds,
  getVizelRegisteredLanguages,
  type VizelCodeBlockLanguage,
  type VizelCodeBlockOptions,
} from "./code-block-lowlight.ts";
// Comment
export {
  createVizelCommentExtension,
  getVizelCommentPluginState,
  VizelCommentMark,
  type VizelCommentMarkOptions,
  type VizelCommentPluginState,
  vizelCommentPluginKey,
} from "./comment.ts";

// Details (collapsible content)
export {
  createVizelDetailsExtensions,
  type VizelDetailsContentOptions,
  type VizelDetailsNodeOptions,
  type VizelDetailsOptions,
  type VizelDetailsSummaryOptions,
} from "./details.ts";

// Diagram (Mermaid, GraphViz)
export {
  createVizelDiagramExtension,
  type GraphvizEngine,
  VizelDiagram,
  type VizelDiagramOptions,
  type VizelDiagramType,
} from "./diagram.ts";

// Drag handle
export {
  createVizelDragHandleExtension,
  createVizelDragHandleExtensions,
  VizelBlockMoveKeymap,
  VizelDragHandle,
  type VizelDragHandleOptions,
} from "./drag-handle.ts";

// Embed (oEmbed, OGP)
export {
  createVizelDefaultFetchEmbedData,
  createVizelEmbedExtension,
  detectVizelEmbedProvider,
  VizelEmbed,
  type VizelEmbedData,
  type VizelEmbedOptions,
  type VizelEmbedProvider,
  type VizelEmbedType,
  type VizelFetchEmbedDataFn,
  vizelDefaultEmbedProviders,
  vizelEmbedPastePluginKey,
} from "./embed.ts";

// File handler
export {
  createVizelFileHandlerExtension,
  createVizelImageFileHandlers,
  filterVizelFilesByMimeType,
  VIZEL_DEFAULT_FILE_MIME_TYPES,
  VIZEL_DEFAULT_IMAGE_MAX_FILE_SIZE,
  type VizelFileHandlerError,
  type VizelFileHandlerErrorType,
  type VizelFileHandlerOptions,
  type VizelImageFileHandlerOptions,
  type VizelImageFileHandlers,
} from "./file-handler.ts";

// Find & Replace
export {
  createVizelFindReplaceExtension,
  getVizelFindReplaceState,
  type VizelFindMatch,
  type VizelFindReplaceOptions,
  type VizelFindReplaceState,
  vizelFindReplacePluginKey,
} from "./find-replace.ts";

// Image
export {
  createVizelImageExtension,
  createVizelImageUploadExtensions,
  createVizelImageUploader,
  createVizelImageUploadPlugin,
  createVizelImageUploadWithFileHandler,
  getVizelImageUploadPluginKey,
  handleVizelImageDrop,
  handleVizelImagePaste,
  VizelImage,
  type VizelImageOptions,
  type VizelImageResizeOptions,
  type VizelImageUploadOptions,
  type VizelImageUploadPluginOptions,
  type VizelImageUploadWithFileHandlerOptions,
  type VizelImageValidationError,
  type VizelImageValidationErrorType,
  type VizelUploadImageFn,
  validateVizelImageFile,
  vizelDefaultBase64Upload,
} from "./image.ts";

// Image resize
export {
  VizelImageResize,
  VizelResizableImage,
  type VizelResizableImageOptions,
} from "./image-resize.ts";

// Link
export { createVizelLinkExtension, type VizelLinkOptions } from "./link.ts";
// Markdown
export {
  createVizelMarkdownExtension,
  VizelMarkdown,
  type VizelMarkdownOptions,
} from "./markdown.ts";
// Mathematics (KaTeX)
export {
  createVizelMathematicsExtensions,
  VizelMathBlock,
  type VizelMathematicsOptions,
  VizelMathInline,
} from "./mathematics.ts";
// Mention
export {
  createVizelMentionExtension,
  type VizelMentionItem,
  type VizelMentionOptions,
} from "./mention.ts";

// Node types
export {
  getVizelActiveNodeType,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "./node-types.ts";

// Slash command
export {
  filterVizelSlashCommands,
  flattenVizelSlashCommandGroups,
  groupVizelSlashCommands,
  searchVizelSlashCommands,
  VizelSlashCommand,
  type VizelSlashCommandExtensionOptions,
  type VizelSlashCommandGroup,
  type VizelSlashCommandItem,
  type VizelSlashCommandRange,
  type VizelSlashCommandSearchResult,
  vizelDefaultGroupOrder,
  vizelDefaultSlashCommands,
} from "./slash-command.ts";

// Table
export {
  createVizelTableExtensions,
  VizelTable,
  VizelTableCell,
  type VizelTableCellAlignment,
  VizelTableHeader,
  type VizelTableOptions,
} from "./table.ts";

// Table controls
export {
  VIZEL_TABLE_MENU_ITEMS,
  type VizelTableControlsOptions,
  type VizelTableControlsUIOptions,
  type VizelTableMenuItem,
  VizelTableWithControls,
} from "./table-controls.ts";

// Task list
export {
  createVizelTaskListExtensions,
  type VizelTaskItemOptions,
  type VizelTaskListExtensionsOptions,
  type VizelTaskListOptions,
} from "./task-list.ts";
// Text color
export {
  addVizelRecentColor,
  createVizelTextColorExtensions,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
  type VizelColorDefinition,
  type VizelTextColorOptions,
} from "./text-color.ts";
// Wiki link
export {
  createVizelWikiLinkExtension,
  VizelWikiLink,
  type VizelWikiLinkOptions,
  type VizelWikiLinkSuggestion,
  vizelWikiLinkPluginKey,
} from "./wiki-link.ts";
