/**
 * @vizel/react
 *
 * React components and hooks for the Vizel visual editor.
 */

// Tiptap React re-exports for convenience
export { useEditor, EditorContent as TiptapEditorContent } from "@tiptap/react";

// Editor components
export {
  EditorRoot,
  EditorContent,
  EditorProvider,
  useEditorContext,
  useEditorContextSafe,
  type EditorRootProps,
  type EditorContentProps,
  type EditorProviderProps,
} from "./components/index.ts";

// BubbleMenu components
export {
  BubbleMenu,
  BubbleMenuButton,
  BubbleMenuDivider,
  BubbleMenuLinkEditor,
  BubbleMenuToolbar,
  type BubbleMenuProps,
  type BubbleMenuButtonProps,
  type BubbleMenuDividerProps,
  type BubbleMenuLinkEditorProps,
  type BubbleMenuToolbarProps,
} from "./components/index.ts";

// SlashMenu components
export {
  SlashMenu,
  SlashMenuItem,
  SlashMenuEmpty,
  createSlashMenuRenderer,
  type SlashMenuProps,
  type SlashMenuRef,
  type SlashMenuItemProps,
  type SlashMenuEmptyProps,
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
