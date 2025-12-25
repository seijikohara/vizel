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
  createImageExtension,
  createImageUploadExtension,
  createImageUploader,
  createImageUploadPlugin,
  createLinkExtension,
  createTableExtensions,
  createVizelExtensions,
  defaultSlashCommands,
  filterSlashCommands,
  getImageUploadPluginKey,
  handleImageDrop,
  handleImagePaste,
  Image,
  ImageResize,
  type ImageResizeOptions,
  type ImageUploadOptions,
  type ImageValidationError,
  type ImageValidationErrorType,
  Link,
  Placeholder,
  ResizableImage,
  SlashCommand,
  type SlashCommandItem,
  type SlashCommandOptions,
  StarterKit,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type UploadImageFn,
  type VizelImageOptions,
  type VizelImageUploadOptions,
  type VizelLinkOptions,
  type VizelStarterKitOptions,
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
