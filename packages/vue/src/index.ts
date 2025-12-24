/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
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
  EDITOR_INJECTION_KEY,
  EditorContent,
  EditorRoot,
  SlashMenu,
  SlashMenuEmpty,
  SlashMenuItem,
  useEditorContext,
  useEditorContextSafe,
} from "./components/index.ts";
// Composables
export {
  createSlashMenuRenderer,
  type SlashMenuRendererOptions,
  type UseBubbleMenuOptions,
  type UseBubbleMenuReturn,
  type UseSlashMenuOptions,
  type UseSlashMenuReturn,
  type UseVizelEditorOptions,
  useBubbleMenu,
  useSlashMenu,
  useVizelEditor,
} from "./composables/index.ts";
// Utilities (framework-agnostic)
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";
