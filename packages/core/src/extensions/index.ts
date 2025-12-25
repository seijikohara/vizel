export {
  createImageExtension,
  createImageUploadExtension,
  createImageUploader,
  createImageUploadPlugin,
  getImageUploadPluginKey,
  handleImageDrop,
  handleImagePaste,
  Image,
  type ImageUploadOptions,
  type ImageValidationError,
  type ImageValidationErrorType,
  type UploadImageFn,
  type VizelImageOptions,
  type VizelImageUploadOptions,
  validateImageFile,
} from "./image.ts";
export { ImageResize, type ImageResizeOptions, ResizableImage } from "./image-resize.ts";
export {
  createLinkExtension,
  Link,
  type VizelLinkOptions,
} from "./link.ts";
export {
  defaultSlashCommands,
  filterSlashCommands,
  SlashCommand,
  type SlashCommandItem,
  type SlashCommandOptions,
} from "./slash-command.ts";
export {
  createVizelExtensions,
  Placeholder,
  StarterKit,
  type VizelStarterKitOptions,
} from "./starter-kit.ts";

export {
  createTableExtensions,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type VizelTableOptions,
} from "./table.ts";
