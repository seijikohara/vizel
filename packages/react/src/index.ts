/**
 * @vizel/react
 *
 * React components and hooks for the Vizel visual editor.
 */

// Tiptap React re-exports for convenience
export { EditorContent as TiptapEditorContent, useEditor } from "@tiptap/react";
// Re-export core types for convenience
export type {
  Editor,
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
  type BubbleMenuButtonProps,
  BubbleMenuDivider,
  type BubbleMenuDividerProps,
  BubbleMenuLinkEditor,
  type BubbleMenuLinkEditorProps,
  type BubbleMenuProps,
  BubbleMenuToolbar,
  type BubbleMenuToolbarProps,
  createSlashMenuRenderer,
  EditorContent,
  type EditorContentProps,
  EditorProvider,
  type EditorProviderProps,
  EditorRoot,
  type EditorRootProps,
  SlashMenu,
  SlashMenuEmpty,
  type SlashMenuEmptyProps,
  SlashMenuItem,
  type SlashMenuItemProps,
  type SlashMenuProps,
  type SlashMenuRef,
  type SlashMenuRendererOptions,
  useEditorContext,
  useEditorContextSafe,
} from "./components/index.ts";
// Hooks
export { type UseVizelEditorOptions, useVizelEditor } from "./hooks/index.ts";
// Utilities (framework-agnostic)
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";
