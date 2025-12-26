import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelCharacterCountOptions } from "./extensions/character-count.ts";
import type { VizelMarkdownOptions } from "./extensions/markdown.ts";
import type { SlashCommandItem } from "./extensions/slash-command.ts";
import type { VizelTaskListOptions } from "./extensions/task-list.ts";
import type { VizelTextColorOptions } from "./extensions/text-color.ts";
import type { ImageUploadOptions } from "./plugins/image-upload.ts";

/**
 * Slash command feature options
 */
export interface VizelSlashCommandOptions {
  /** Custom slash command items */
  items?: SlashCommandItem[];
  /** Suggestion options (framework-specific renderer) */
  suggestion?: Record<string, unknown>;
}

/**
 * Image feature options
 */
export interface VizelImageFeatureOptions extends Partial<ImageUploadOptions> {
  /** Enable image resizing (default: true) */
  resize?: boolean;
}

/**
 * Feature configuration for Vizel editor.
 * All features are enabled by default.
 * Set to false to disable a feature, or pass options to configure it.
 */
export interface VizelFeatureOptions {
  /** Slash command menu (type "/" to open) */
  slashCommand?: VizelSlashCommandOptions | false;
  /** Table support */
  table?: boolean;
  /** Link extension */
  link?: boolean;
  /** Image upload and resize */
  image?: VizelImageFeatureOptions | false;
  /** Markdown import/export support */
  markdown?: VizelMarkdownOptions | boolean;
  /** Task list (checkbox) support */
  taskList?: VizelTaskListOptions | boolean;
  /** Character and word count tracking */
  characterCount?: VizelCharacterCountOptions | boolean;
  /** Text color and highlight support */
  textColor?: VizelTextColorOptions | boolean;
}

/**
 * Editor configuration options
 */
export interface VizelEditorOptions {
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Auto focus on mount */
  autofocus?: boolean | "start" | "end" | "all" | number;
  /** Callback when content changes */
  onUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor is created */
  onCreate?: (props: { editor: Editor }) => void;
  /** Callback when editor is destroyed */
  onDestroy?: () => void;
  /** Callback when selection changes */
  onSelectionUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor gets focus */
  onFocus?: (props: { editor: Editor }) => void;
  /** Callback when editor loses focus */
  onBlur?: (props: { editor: Editor }) => void;
}

/**
 * Editor state for external consumption
 */
export interface VizelEditorState {
  /** Whether the editor is currently focused */
  isFocused: boolean;
  /** Whether the editor is empty */
  isEmpty: boolean;
  /** Whether content can be undone */
  canUndo: boolean;
  /** Whether content can be redone */
  canRedo: boolean;
  /** Character count */
  characterCount: number;
  /** Word count */
  wordCount: number;
}

/**
 * Re-export Tiptap types for convenience
 */
export type { Extensions, JSONContent } from "@tiptap/core";
