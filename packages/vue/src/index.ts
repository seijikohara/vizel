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
  Blockquote,
  Bold,
  BubbleMenuExtension,
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
  Editor,
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
  SlashCommand,
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
  validateImageFile,
} from "@vizel/core";

// Components
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
