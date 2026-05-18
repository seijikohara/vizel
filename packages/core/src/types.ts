import type { Editor, Extensions, JSONContent } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { VizelCalloutOptions } from "./extensions/callout.ts";
import type { VizelCharacterCountOptions } from "./extensions/character-count.ts";
import type { VizelCommentMarkOptions } from "./extensions/comment.ts";
import type { VizelDetailsOptions } from "./extensions/details.ts";
import type { VizelDiagramOptions } from "./extensions/diagram.ts";
import type { VizelDragHandleOptions } from "./extensions/drag-handle.ts";
import type { VizelEmbedOptions } from "./extensions/embed.ts";
import type { VizelMathematicsOptions } from "./extensions/mathematics.ts";
import type { VizelMentionOptions } from "./extensions/mention.ts";
import type { VizelSlashCommandItem } from "./extensions/slash-command.ts";
import type { VizelTableOptions } from "./extensions/table.ts";
import type { VizelTableOfContentsOptions } from "./extensions/table-of-contents.ts";
import type { VizelTaskListExtensionsOptions } from "./extensions/task-list.ts";
import type { VizelTextColorOptions } from "./extensions/text-color.ts";
import type { VizelWikiLinkOptions } from "./extensions/wiki-link.ts";
import type { VizelLocale } from "./i18n/types.ts";
import type { VizelImageUploadPluginOptions } from "./plugins/image-upload.ts";
import type { VizelError } from "./utils/errorHandling.ts";
import type { VizelMarkdownFlavor } from "./utils/markdown-flavors.ts";

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
 *
 * Features are grouped into three categories that answer different
 * consumer questions:
 *
 * - `content` — What can the document contain?
 * - `interaction` — How does the user edit?
 * - `collaboration` — Who edits together?
 *
 * Each field accepts one of:
 *
 * - `true` — enable the feature with default options.
 * - `false` — disable the feature.
 * - an options object — enable with custom options.
 *
 * Always-on core (no opt-in needed): paragraph, heading, list,
 * blockquote, bold/italic/strike/code marks, hard break, horizontal
 * rule, link, code block (with lowlight), markdown import/export,
 * undo/redo. These extensions load regardless of `features`.
 */
export interface VizelFeatureOptions {
  /** Content features — what the document can contain. */
  content?: VizelContentFeatureOptions;
  /** Interaction features — how the user edits. */
  interaction?: VizelInteractionFeatureOptions;
  /** Collaboration features — who edits together. */
  collaboration?: VizelCollaborationFeatureOptions;
}

/**
 * Content features — what the document can contain.
 */
export interface VizelContentFeatureOptions {
  /** Image upload and resize */
  image?: VizelImageFeatureOptions | boolean;
  /** Table support with column/row controls */
  table?: VizelTableOptions | boolean;
  /** Mathematics (LaTeX) support with KaTeX rendering */
  mathematics?: VizelMathematicsOptions | boolean;
  /** Diagram support (Mermaid, GraphViz) */
  diagram?: VizelDiagramOptions | boolean;
  /** URL embedding with oEmbed/OGP support */
  embed?: VizelEmbedOptions | boolean;
  /** Callout / admonition blocks (info, warning, danger, tip, note) */
  callout?: VizelCalloutOptions | boolean;
  /** Collapsible content blocks (accordion) */
  details?: VizelDetailsOptions | boolean;
  /** Text color and highlight support */
  textColor?: VizelTextColorOptions | boolean;
  /** Underline mark (default-on) */
  underline?: boolean;
  /** Superscript mark (e.g., x²) */
  superscript?: boolean;
  /** Subscript mark (e.g., H₂O) */
  subscript?: boolean;
  /** Task list (checkbox) support */
  taskList?: VizelTaskListExtensionsOptions | boolean;
  /** Wiki links ([[page-name]], [[page|display text]]) for knowledge base use cases */
  wikiLink?: VizelWikiLinkOptions | boolean;
  /** Table of Contents block that auto-collects headings */
  tableOfContents?: VizelTableOfContentsOptions | boolean;
}

/**
 * Interaction features — how the user edits.
 */
export interface VizelInteractionFeatureOptions {
  /** Slash command menu (type "/" to open) */
  slashMenu?: VizelSlashCommandOptions | boolean;
  /**
   * Per-item drag handle for reordering blocks and list items
   * (bullet, ordered, task) at any nesting depth, with Alt+Up/Down
   * keyboard shortcuts.
   */
  dragHandle?: VizelDragHandleOptions | boolean;
  /**
   * @mention autocomplete for user mentions.
   * Disabled by default — requires user-provided items function.
   * @example
   * ```ts
   * mention: {
   *   items: async (query) => users.filter(u => u.label.includes(query)),
   * }
   * ```
   */
  mention?: VizelMentionOptions | boolean;
  /** Character and word count tracking */
  characterCount?: VizelCharacterCountOptions | boolean;
  /** Typography auto-conversion (smart quotes, em-dashes, ellipsis, etc.) */
  typography?: boolean;
}

/**
 * Collaboration features — who edits together.
 */
export interface VizelCollaborationFeatureOptions {
  /** Comment/annotation marks for collaborative review workflows */
  comments?: VizelCommentMarkOptions | boolean;
  /**
   * Enable collaboration mode. When set, the History extension is
   * excluded — Yjs (or another CRDT provider) supplies its own undo
   * manager. A future release replaces this `boolean` with a
   * structured collaboration-provider type.
   */
  provider?: boolean;
}

/**
 * Editor configuration options
 */
export interface VizelEditorOptions {
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /**
   * Locale for UI strings.
   * Defaults to English (`vizelEnLocale`).
   * Use `createVizelLocale()` to merge partial translations with the default.
   */
  locale?: VizelLocale;
  /**
   * Markdown output flavor.
   * Controls how Markdown is serialized when exporting content.
   *
   * - `"commonmark"` — Standard CommonMark (callouts fall back to blockquotes)
   * - `"gfm"` — GitHub Flavored Markdown with `> [!NOTE]` alerts (default)
   * - `"obsidian"` — Obsidian-style `> [!note]` callouts and `[[wiki-links]]`
   * - `"docusaurus"` — Docusaurus/VitePress `:::note` admonitions
   *
   * Input parsing is always tolerant: all callout formats are recognized regardless of flavor.
   * @default "gfm"
   */
  flavor?: VizelMarkdownFlavor;
  /**
   * Initial content in JSON format.
   *
   * Mutually exclusive with {@link VizelEditorOptions.initialMarkdown}. If
   * both are provided, `initialMarkdown` wins and a warning is emitted at
   * editor creation time.
   */
  initialContent?: JSONContent;
  /**
   * Initial content in Markdown format.
   *
   * Mutually exclusive with {@link VizelEditorOptions.initialContent}. If
   * both are provided, `initialMarkdown` wins and a warning is emitted at
   * editor creation time.
   *
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
  /**
   * Whether the editor accepts user input.
   * Toggle at runtime to switch between read-write and read-only modes;
   * the framework hooks/composables/runes propagate the change through
   * `editor.setEditable()` automatically.
   * @default true
   */
  editable?: boolean;
  /**
   * Auto focus on mount.
   * - `false` (default) — do not focus.
   * - `true` — focus and place the cursor at the end of the document.
   * - `"start"` / `"end"` / `"all"` — focus with the corresponding selection.
   * - `number` — focus and place the cursor at that document position
   *   (clamped to `[0, docSize]`).
   * @default false
   */
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
   * Behavior:
   * - When this callback is supplied, the consumer is treated as having
   *   handled the failure. The hook/composable/rune does NOT also rethrow.
   * - When this callback is omitted, the error is rethrown so global
   *   handlers (Sentry, `window.onunhandledrejection`, test runners) can
   *   observe initialization failures.
   *
   * Supply this callback only when you want to fully take over the error
   * surface (e.g. translate to UI state, swallow during tests). Leave it
   * unset to keep the default rethrow contract.
   *
   * @example
   * ```typescript
   * const editor = useVizelEditor({
   *   onError: (error) => {
   *     console.error(`[${error.code}] ${error.message}`);
   *     setEditorError(error);
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
 * Result of Markdown synchronization.
 *
 * Each framework-specific composable/hook/rune returns a result that
 * structurally satisfies this interface (with framework-idiomatic reactive
 * wrappers for `markdown` and `isPending`). The `flush` method is included
 * so all frameworks expose the same surface.
 */
export interface VizelMarkdownSyncResult {
  /** Current markdown content (reactive in framework wrappers) */
  markdown: string;
  /**
   * Set markdown content to the editor.
   * Automatically transforms diagram code blocks if transformDiagrams is enabled.
   */
  setMarkdown: (markdown: string) => void;
  /** Whether markdown export is currently pending (debounced) */
  isPending: boolean;
  /** Force any pending debounced markdown export to run immediately. */
  flush: () => void;
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
 * Options shared by every Tiptap suggestion renderer (slash menu, mention
 * menu, future suggestion-driven surfaces).
 *
 * Renamed from `VizelSlashMenuRendererOptions` in v2.0 because the same
 * shape is reused by `createVizelMentionMenuRenderer`. The old name is
 * still exported as a deprecated alias for one minor cycle.
 */
export interface VizelSuggestionRendererOptions {
  /** Custom class name for the menu */
  className?: string;
}

/**
 * @deprecated Use {@link VizelSuggestionRendererOptions} instead.
 * Kept as a type alias for one minor cycle so existing consumers can
 * migrate without an immediate type error. The shape is identical.
 */
export type VizelSlashMenuRendererOptions = VizelSuggestionRendererOptions;

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
