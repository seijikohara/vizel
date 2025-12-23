/**
 * @vizel/vue
 *
 * Vue 3 components and composables for the Vizel visual editor.
 */

// Tiptap re-exports for convenience
export { Editor } from "@tiptap/core";
export { default as BubbleMenuExtension } from "@tiptap/extension-bubble-menu";

// Components
export {
  EditorRoot,
  EditorContent,
  useEditorContext,
  useEditorContextSafe,
  EDITOR_INJECTION_KEY,
} from "./components/index.ts";

// Composables
export { useVizelEditor, type UseVizelEditorOptions } from "./composables/index.ts";

// Utilities
export { createVanillaSlashMenuRenderer } from "./utils/slashMenuRenderer.ts";

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
