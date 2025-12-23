/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// Types
export type {
  VizelEditorOptions,
  VizelEditorState,
  Editor,
  JSONContent,
  Extensions,
} from "./types.ts";

// Extensions
export {
  createVizelExtensions,
  StarterKit,
  Placeholder,
  type VizelStarterKitOptions,
  SlashCommand,
  defaultSlashCommands,
  filterSlashCommands,
  type SlashCommandItem,
  type SlashCommandOptions,
  createImageExtension,
  Image,
  type VizelImageOptions,
  createLinkExtension,
  Link,
  type VizelLinkOptions,
  createTableExtensions,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  type VizelTableOptions,
} from "./extensions/index.ts";

// Re-export Tiptap core for advanced usage
export { Editor as TiptapEditor } from "@tiptap/core";
