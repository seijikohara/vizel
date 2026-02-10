import type { Editor, Extensions, JSONContent } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { VizelCalloutOptions } from "./extensions/callout.ts";
import type { VizelCharacterCountOptions } from "./extensions/character-count.ts";
import type { VizelCodeBlockOptions } from "./extensions/code-block-lowlight.ts";
import type { VizelCommentMarkOptions } from "./extensions/comment.ts";
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
import type { VizelWikiLinkOptions } from "./extensions/wiki-link.ts";
import type { VizelImageUploadPluginOptions } from "./plugins/image-upload.ts";
import type { VizelError } from "./utils/errorHandling.ts";

/**
 * Slash command feature options
 */
export interface VizelSlashCommandOptions {
  /** Custom slash command items */
  items?: VizelSlashCommandItem[];
  /** Suggestion options (framework-specific renderer) */
  suggestion?: Partial<SuggestionOptions<VizelSlashCommandItem>>;
}

/**
 * Image feature options
 */
export interface VizelImageFeatureOptions extends Partial<VizelImageUploadPluginOptions> {
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
  /** Callout / admonition blocks (info, warning, danger, tip, note) */
  callout?: VizelCalloutOptions | boolean;
  /** Diagram support (Mermaid, GraphViz) */
  diagram?: VizelDiagramOptions | boolean;
  /** Wiki links ([[page-name]], [[page|display text]]) for knowledge base use cases */
  wikiLink?: VizelWikiLinkOptions | boolean;
  /** Comment/annotation marks for collaborative review workflows */
  comment?: VizelCommentMarkOptions | boolean;
  /**
   * Real-time collaboration mode.
   * When enabled, the History extension is excluded (Yjs provides its own undo manager).
   * Users must install and configure Yjs collaboration extensions separately.
   */
  collaboration?: boolean;
}

/**
 * Editor configuration options
 */
export interface VizelEditorOptions {
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /**
   * Initial content in Markdown format.
   * If both initialContent and initialMarkdown are provided, initialMarkdown takes precedence.
   * @example
   * ```typescript
   * const editor = useVizelEditor({
   *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
   * });
   * ```
   */
  initialMarkdown?: string;
  /**
   * Automatically transform diagram code blocks (mermaid, graphviz) to diagram nodes
   * when importing markdown content. Only applies when initialMarkdown is provided.
   * @default true
   */
  transformDiagramsOnImport?: boolean;
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
  /**
   * Callback when an error occurs during editor operations.
   * Provides structured error information for logging or user feedback.
   *
   * Note: After this callback is invoked, the error is re-thrown to preserve
   * existing error handling behavior. This callback is primarily for logging,
   * analytics, or showing user notifications.
   *
   * @example
   * ```typescript
   * const editor = useVizelEditor({
   *   onError: (error) => {
   *     console.error(`[${error.code}] ${error.message}`);
   *     // Optionally show user notification
   *   },
   * });
   * ```
   */
  onError?: (error: VizelError) => void;
}

/**
 * Options for Markdown synchronization
 */
export interface VizelMarkdownSyncOptions {
  /**
   * Debounce delay in milliseconds for markdown export.
   * Set to 0 for immediate export (not recommended for large documents).
   * @default 300
   */
  debounceMs?: number;
  /**
   * Automatically transform diagram code blocks when setting markdown content.
   * @default true
   */
  transformDiagrams?: boolean;
}

/**
 * Result of Markdown synchronization
 */
export interface VizelMarkdownSyncResult {
  /** Current markdown content (reactive) */
  markdown: string;
  /**
   * Set markdown content to the editor.
   * Automatically transforms diagram code blocks if transformDiagrams is enabled.
   */
  setMarkdown: (markdown: string) => void;
  /** Whether markdown export is currently pending (debounced) */
  isPending: boolean;
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
 * Options for creating a slash menu renderer
 */
export interface VizelSlashMenuRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

/**
 * Options for creating a Vizel editor instance with framework hooks/composables/runes.
 * Extends VizelEditorOptions with ability to add custom Tiptap extensions.
 */
export interface VizelCreateEditorOptions extends VizelEditorOptions {
  /**
   * Additional Tiptap extensions to include.
   * These are added alongside the default Vizel extensions.
   *
   * @example
   * ```typescript
   * import { useVizelEditor } from '@vizel/react';
   * import { Underline } from '@tiptap/extension-underline';
   *
   * const editor = useVizelEditor({
   *   extensions: [Underline],
   * });
   * ```
   */
  extensions?: Extensions;
}
