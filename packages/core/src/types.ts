import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelCharacterCountOptions } from "./extensions/character-count.ts";
import type { VizelCodeBlockOptions } from "./extensions/code-block-lowlight.ts";
import type { VizelDetailsOptions } from "./extensions/details.ts";
import type { VizelDiagramOptions } from "./extensions/diagram.ts";
import type { VizelDragHandleOptions } from "./extensions/drag-handle.ts";
import type { VizelEmbedOptions } from "./extensions/embed.ts";
import type { VizelLinkOptions } from "./extensions/link.ts";
import type { VizelMarkdownOptions } from "./extensions/markdown.ts";
import type { VizelMathematicsOptions } from "./extensions/mathematics.ts";
import type { VizelSlashCommandItem } from "./extensions/slash-command.ts";
import type { VizelTableOptions } from "./extensions/table.ts";
import type { VizelTaskListExtensionsOptions } from "./extensions/task-list.ts";
import type { VizelTextColorOptions } from "./extensions/text-color.ts";
import type { ImageUploadOptions } from "./plugins/image-upload.ts";

/**
 * Slash command feature options
 */
export interface VizelSlashCommandOptions {
  /** Custom slash command items */
  items?: VizelSlashCommandItem[];
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
 * Set to `true` to enable with defaults, `false` to disable, or pass options to configure.
 */
export interface VizelFeatureOptions {
  /** Slash command menu (type "/" to open) */
  slashCommand?: VizelSlashCommandOptions | boolean;
  /** Table support with column/row controls */
  table?: VizelTableOptions | boolean;
  /** Link extension with autolink and paste support */
  link?: VizelLinkOptions | boolean;
  /** Image upload and resize */
  image?: VizelImageFeatureOptions | boolean;
  /** Markdown import/export support */
  markdown?: VizelMarkdownOptions | boolean;
  /** Task list (checkbox) support */
  taskList?: VizelTaskListExtensionsOptions | boolean;
  /** Character and word count tracking */
  characterCount?: VizelCharacterCountOptions | boolean;
  /** Text color and highlight support */
  textColor?: VizelTextColorOptions | boolean;
  /** Code block with syntax highlighting */
  codeBlock?: VizelCodeBlockOptions | boolean;
  /** Mathematics (LaTeX) support with KaTeX rendering */
  mathematics?: VizelMathematicsOptions | boolean;
  /** Drag handle for block reordering (includes Alt+Up/Down keyboard shortcuts) */
  dragHandle?: VizelDragHandleOptions | boolean;
  /** URL embedding with oEmbed/OGP support */
  embed?: VizelEmbedOptions | boolean;
  /** Collapsible content blocks (accordion) */
  details?: VizelDetailsOptions | boolean;
  /** Diagram support (Mermaid, GraphViz) */
  diagram?: VizelDiagramOptions | boolean;
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
