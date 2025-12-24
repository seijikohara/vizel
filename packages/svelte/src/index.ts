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
  createLinkExtension,
  createTableExtensions,
  createVizelExtensions,
  defaultSlashCommands,
  filterSlashCommands,
  Image,
  Link,
  Placeholder,
  SlashCommand,
  StarterKit,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type VizelImageOptions,
  type VizelStarterKitOptions,
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
} from "./runes/index.ts";
// Renderers
export {
  createSlashMenuRenderer,
  type SlashMenuRendererOptions,
} from "./utils/createSlashMenuRenderer.ts";
// Utilities (framework-agnostic)
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";
