/**
 * @vizel/react
 *
 * React components and hooks for the Vizel visual editor.
 */

// Components
export {
  EditorRoot,
  EditorContent,
  EditorProvider,
  useEditorContext,
  useEditorContextSafe,
  BubbleMenu,
  SlashMenu,
  createSlashMenuRenderer,
  type EditorRootProps,
  type EditorContentProps,
  type EditorProviderProps,
  type BubbleMenuProps,
  type SlashMenuProps,
  type SlashMenuRef,
  type SlashMenuRendererOptions,
} from "./components/index.ts";

// Hooks
export { useVizelEditor, type UseVizelEditorOptions } from "./hooks/index.ts";

// Re-export core types for convenience
export type {
  VizelEditorOptions,
  VizelEditorState,
  Editor,
  JSONContent,
  SlashCommandItem,
  SlashCommandOptions,
} from "@vizel/core";

// Re-export core extensions
export {
  createVizelExtensions,
  SlashCommand,
  defaultSlashCommands,
  filterSlashCommands,
  createImageExtension,
  Image,
  type VizelStarterKitOptions,
  type VizelImageOptions,
} from "@vizel/core";
