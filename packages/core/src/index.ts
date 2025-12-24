/**
 * @vizel/core
 *
 * Framework-agnostic core for Vizel visual editor.
 * Built on top of Tiptap and ProseMirror.
 */

// Re-export Tiptap core for advanced usage
export { Editor as TiptapEditor } from "@tiptap/core";

// Extensions
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
  type SlashCommandItem,
  type SlashCommandOptions,
  StarterKit,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type VizelImageOptions,
  type VizelLinkOptions,
  type VizelStarterKitOptions,
  type VizelTableOptions,
} from "./extensions/index.ts";
// Types
export type {
  Editor,
  Extensions,
  JSONContent,
  VizelEditorOptions,
  VizelEditorState,
} from "./types.ts";
