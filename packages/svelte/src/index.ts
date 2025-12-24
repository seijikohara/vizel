/**
 * @vizel/svelte
 *
 * Svelte 5 components for the Vizel visual editor.
 */

// Tiptap re-exports for convenience
export { Editor } from "@tiptap/core";
export { default as BubbleMenuExtension } from "@tiptap/extension-bubble-menu";

// Editor components
export {
  EditorRoot,
  EditorContent,
  getEditorContext,
  getEditorContextSafe,
  EDITOR_CONTEXT_KEY,
} from "./components/index.ts";

// BubbleMenu components
export {
  BubbleMenu,
  BubbleMenuButton,
  BubbleMenuDivider,
  BubbleMenuLinkEditor,
  BubbleMenuToolbar,
} from "./components/index.ts";

// SlashMenu components
export {
  SlashMenu,
  SlashMenuItem,
  SlashMenuEmpty,
  type SlashMenuRef,
} from "./components/index.ts";

// Editor factory
export {
  createVizelEditor,
  type CreateVizelEditorOptions,
} from "./createVizelEditor.ts";

// Utilities
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";
export {
  createSlashMenuRenderer,
  type SlashMenuRendererOptions,
} from "./utils/createSlashMenuRenderer.ts";

// Re-export core types for convenience
export type {
  VizelEditorOptions,
  VizelEditorState,
  JSONContent,
  SlashCommandItem,
  SlashCommandOptions,
  VizelLinkOptions,
  VizelTableOptions,
} from "@vizel/core";

// Re-export core extensions
export {
  createVizelExtensions,
  StarterKit,
  Placeholder,
  SlashCommand,
  defaultSlashCommands,
  filterSlashCommands,
  createImageExtension,
  Image,
  createLinkExtension,
  Link,
  createTableExtensions,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  type VizelStarterKitOptions,
  type VizelImageOptions,
} from "@vizel/core";
