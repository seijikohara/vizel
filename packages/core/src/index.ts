/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// Re-export Tiptap core for advanced usage
export { Editor, Editor as TiptapEditor } from "@tiptap/core";
export {
  BubbleMenuPlugin,
  default as BubbleMenuExtension,
} from "@tiptap/extension-bubble-menu";

// Extensions
export {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  createImageExtension,
  createImageUploadExtension,
  createImageUploader,
  createImageUploadPlugin,
  createLinkExtension,
  createTableExtensions,
  createVizelExtensions,
  Document,
  Dropcursor,
  defaultSlashCommands,
  filterSlashCommands,
  Gapcursor,
  getImageUploadPluginKey,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  handleImageDrop,
  handleImagePaste,
  Image,
  ImageResize,
  type ImageResizeOptions,
  type ImageUploadOptions,
  type ImageValidationError,
  type ImageValidationErrorType,
  Italic,
  Link,
  ListItem,
  ListKeymap,
  OrderedList,
  Paragraph,
  Placeholder,
  ResizableImage,
  SlashCommand,
  type SlashCommandItem,
  type SlashCommandOptions,
  Strike,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  type UploadImageFn,
  type VizelExtensionsOptions,
  type VizelImageOptions,
  type VizelImageUploadOptions,
  type VizelLinkOptions,
  type VizelTableOptions,
  validateImageFile,
} from "./extensions/index.ts";
// Types
export type {
  Extensions,
  JSONContent,
  VizelEditorOptions,
  VizelEditorState,
  VizelFeatureOptions,
  VizelImageFeatureOptions,
  VizelSlashCommandOptions,
} from "./types.ts";
// Utilities
export {
  type CreateUploadEventHandlerOptions,
  createUploadEventHandler,
  defaultEditorProps,
  type ResolveFeaturesOptions,
  registerUploadEventHandler,
  resolveFeatures,
  VIZEL_UPLOAD_IMAGE_EVENT,
} from "./utils/index.ts";
