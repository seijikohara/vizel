import type { Editor, Extensions, JSONContent } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { VizelCollaborationProvider } from "./collaboration-provider.ts";
import type { VizelCalloutOptions } from "./extensions/callout.ts";
import type { VizelCharacterCountOptions } from "./extensions/character-count.ts";
import type { VizelCommentMarkOptions } from "./extensions/comment.ts";
import type { VizelDetailsOptions } from "./extensions/details.ts";
import type { VizelDiagramOptions } from "./extensions/diagram.ts";
import type { VizelDragHandleOptions } from "./extensions/drag-handle.ts";
import type { VizelEmbedOptions } from "./extensions/embed.ts";
import type { VizelHighlightOptions } from "./extensions/highlight.ts";
import type { VizelMathematicsOptions } from "./extensions/mathematics.ts";
import type { VizelMentionOptions } from "./extensions/mention.ts";
import type { VizelPresenceOptions } from "./extensions/presence.ts";
import type { VizelSlashCommandItem } from "./extensions/slash-command.ts";
import type { VizelTableOptions } from "./extensions/table.ts";
import type { VizelTableOfContentsOptions } from "./extensions/table-of-contents.ts";
import type { VizelTaskListExtensionsOptions } from "./extensions/task-list.ts";
import type { VizelTextColorOptions } from "./extensions/text-color.ts";
import type { VizelTypographyOptions } from "./extensions/typography.ts";
import type { VizelWikiLinkOptions } from "./extensions/wiki-link.ts";
import type { VizelLocale } from "./i18n/types.ts";
import type { VizelMarkdownEncodingOptions, VizelMarkdownFlavor } from "./markdown/types.ts";
import type { VizelImageUploadPluginOptions } from "./plugins/image-upload.ts";
import type { VizelError } from "./utils/errorHandling.ts";
import type { VizelVersionHistoryOptions } from "./version-history.ts";

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
  /** Text color (foreground) mark */
  textColor?: VizelTextColorOptions | boolean;
  /** Highlight (background) mark */
  highlight?: VizelHighlightOptions | boolean;
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
  /**
   * Typography auto-conversion (smart quotes, em-dashes, ellipsis, etc.).
   * Pass an options object to override individual replacement characters.
   */
  typography?: VizelTypographyOptions | boolean;
  /**
   * Placeholder text shown when the editor is empty.
   * Default: "Type '/' for commands...".
   */
  placeholder?: string;
  /**
   * Maximum number of history entries (undo / redo depth).
   * Forwarded to the Tiptap History extension. When `collaboration.provider`
   * is set, the History extension is excluded and this value is ignored.
   * @default 100
   */
  historyDepth?: number;
}

/**
 * Collaboration features — who edits together.
 */
export interface VizelCollaborationFeatureOptions {
  /** Comment/annotation marks for collaborative review workflows */
  comments?: VizelCommentMarkOptions | boolean;
  /**
   * Enable collaboration mode. Pass `true` for the legacy
   * History-excluded mode (consumer wires Yjs separately), or pass a
   * `VizelCollaborationProvider` adapter to let Vizel manage connect /
   * disconnect on the editor lifecycle.
   *
   * When set (to any truthy value), the History extension is excluded
   * — the provider supplies its own undo manager.
   */
  provider?: VizelCollaborationProvider | boolean;
  /**
   * Version history snapshot management. The boolean form is a typed
   * opt-in marker (consumers still call `useVizelVersionHistory` to
   * use it); the options form lets callers prefill storage / event
   * hooks the hook will consume.
   */
  versionHistory?: VizelVersionHistoryOptions | boolean;
  /**
   * Real-time collaborative cursors and selections rendered through a
   * generic awareness adapter (Yjs Awareness satisfies the shape
   * natively). Disabled by default — requires consumer-supplied
   * `awareness` and `currentUser`.
   */
  presence?: VizelPresenceOptions;
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
   * Markdown pipeline configuration.
   *
   * - `flavor` selects the Markdown output flavor. The parser remains
   *   tolerant across formats; only serialization follows the selected
   *   flavor. Defaults to {@link vizelGfmFlavor} when omitted.
   * - `encoding` selects the per-node encoding mode for nodes that have
   *   no canonical Markdown representation (`embed`, `mention`,
   *   `wikiLink`). `"default"` chooses the lossy-but-portable
   *   encoding; `"metadata-comment"` chooses the lossless-but-noisy
   *   encoding that preserves identifiers via a trailing HTML comment.
   */
  markdown?: {
    readonly flavor?: VizelMarkdownFlavor;
    readonly encoding?: VizelMarkdownEncodingOptions;
  };
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
 */
export interface VizelSuggestionRendererOptions {
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
