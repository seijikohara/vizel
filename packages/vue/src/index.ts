/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
 */

// Re-export core types for convenience
export type {
  JSONContent,
  SlashCommandItem,
  SlashCommandOptions,
  VizelEditorOptions,
  VizelEditorState,
  VizelLinkOptions,
  VizelTableOptions,
} from "@vizel/core";

// Re-export core extensions
export {
  BubbleMenuExtension,
  createImageExtension,
  createImageUploadExtension,
  createImageUploader,
  createImageUploadPlugin,
  createLinkExtension,
  createTableExtensions,
  createVizelExtensions,
  defaultSlashCommands,
  Editor,
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
  StarterKit,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type UploadImageFn,
  type VizelImageOptions,
  type VizelImageUploadOptions,
  type VizelStarterKitOptions,
  validateImageFile,
} from "@vizel/core";
// BubbleMenu components
// Editor components
// SlashMenu components
export {
  BubbleMenu,
  BubbleMenuButton,
  type BubbleMenuButtonProps,
  BubbleMenuDivider,
  type BubbleMenuDividerProps,
  BubbleMenuLinkEditor,
  type BubbleMenuLinkEditorProps,
  type BubbleMenuProps,
  BubbleMenuToolbar,
  type BubbleMenuToolbarProps,
  EditorContent,
  type EditorContentProps,
  EditorRoot,
  type EditorRootProps,
  SlashMenu,
  SlashMenuEmpty,
  type SlashMenuEmptyProps,
  SlashMenuItem,
  type SlashMenuItemProps,
  type SlashMenuProps,
  type SlashMenuRef,
  useEditorContext,
  useEditorContextSafe,
} from "./components/index.ts";

// Composables
export {
  createSlashMenuRenderer,
  type SlashMenuRendererOptions,
  type UseVizelEditorOptions,
  useVizelEditor,
} from "./composables/index.ts";
