/**
 * @vizel/svelte
 *
 * Svelte 5 components for the Vizel visual editor.
 */

// Tiptap re-exports for convenience
export { Editor } from "@tiptap/core";
export { default as BubbleMenuExtension } from "@tiptap/extension-bubble-menu";
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
// Editor components
// BubbleMenu components
// SlashMenu components
export {
  BubbleMenu,
  BubbleMenuButton,
  BubbleMenuDivider,
  BubbleMenuLinkEditor,
  BubbleMenuToolbar,
  EDITOR_CONTEXT_KEY,
  EditorContent,
  EditorRoot,
  getEditorContext,
  getEditorContextSafe,
  SlashMenu,
  SlashMenuEmpty,
  SlashMenuItem,
  type SlashMenuRef,
} from "./components/index.ts";
// Editor factory
export {
  type CreateVizelEditorOptions,
  createVizelEditor,
} from "./createVizelEditor.ts";
// Runes (Svelte 5 reactive state)
export {
  type BubbleMenuState,
  type CreateBubbleMenuOptions,
  createBubbleMenu,
  createSlashMenu,
  type SlashMenuState,
  type UseVizelEditorOptions,
  useVizelEditor,
} from "./runes/index.ts";
// Renderers
export {
  createSlashMenuRenderer,
  type SlashMenuRendererOptions,
} from "./utils/createSlashMenuRenderer.ts";
// Utilities (framework-agnostic)
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";
