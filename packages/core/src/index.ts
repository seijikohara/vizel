/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// Re-export Tiptap core for advanced usage
export { Editor as TiptapEditor } from "@tiptap/core";

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
  type ImageUploadOptions,
  type ImageValidationError,
  type ImageValidationErrorType,
  Link,
  Placeholder,
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
  Editor,
  Extensions,
  JSONContent,
  VizelEditorOptions,
  VizelEditorState,
} from "./types.ts";
