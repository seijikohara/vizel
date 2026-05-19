import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelMarkdownSyncOptions } from "../types.ts";
import {
  convertVizelCodeBlocksToDiagrams,
  transformVizelDiagramCodeBlocks,
  type VizelContentNode,
} from "./editorHelpers.ts";
import type { VizelError } from "./errorHandling.ts";

/**
 * Default debounce delay for markdown export in milliseconds.
 */
export const VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS = 300;

/**
 * Get markdown content from the editor.
 *
 * The Markdown extension is always installed by Vizel, so
 * `editor.getMarkdown()` is guaranteed to exist when the editor is
 * non-null (Section 10 of the v2.0.0 spec). Returns an empty string
 * when the editor is missing.
 *
 * @param editor - The editor instance
 * @param _onError - Reserved for future use. The current implementation
 *   never reports recoverable errors from this path because the
 *   Markdown extension is always-on; the parameter is kept for API
 *   symmetry with the parse / set helpers below.
 */
export function getVizelMarkdown(
  editor: Editor | null | undefined,
  _onError?: (err: VizelError) => void
): string {
  if (!editor) return "";
  return editor.getMarkdown();
}

/**
 * Set markdown content to the editor.
 *
 * Returns `true` if the operation succeeded, `false` only when the
 * editor reference is missing. The Markdown extension is always-on, so
 * no capability check is required.
 *
 * @param editor - The editor instance
 * @param markdown - The markdown content to set
 * @param options - Options for setting content
 * @returns Whether the markdown was applied to the editor
 */
export function setVizelMarkdown(
  editor: Editor | null | undefined,
  markdown: string,
  options: { transformDiagrams?: boolean; onError?: (err: VizelError) => void } = {}
): boolean {
  if (!editor) return false;

  const { transformDiagrams = true } = options;

  // tiptap-markdown overrides `setContent` so a raw string is parsed as
  // markdown automatically; no `contentType` cast is needed.
  editor.commands.setContent(markdown);

  if (transformDiagrams) {
    convertVizelCodeBlocksToDiagrams(editor);
  }

  return true;
}

/**
 * Parse markdown to JSON content.
 *
 * Returns `null` only when the editor reference is missing. The
 * Markdown extension is always-on, so `editor.markdown.parse` is
 * guaranteed to exist.
 *
 * @param editor - The editor instance (needed for markdown extension access)
 * @param markdown - The markdown content to parse
 * @param options - Options for parsing
 * @returns The parsed JSON content, or null if the editor is missing
 */
export function parseVizelMarkdown(
  editor: Editor | null | undefined,
  markdown: string,
  options: { transformDiagrams?: boolean; onError?: (err: VizelError) => void } = {}
): JSONContent | null {
  if (!editor) return null;

  const { transformDiagrams = true } = options;
  const parsed = editor.markdown.parse(markdown);

  if (transformDiagrams && parsed?.type) {
    return transformVizelDiagramCodeBlocks(parsed as VizelContentNode);
  }

  return parsed;
}

/**
 * Initialize editor with markdown content.
 * This should be called in onCreate callback when using initialMarkdown.
 *
 * @param editor - The editor instance
 * @param markdown - The markdown content to set
 * @param options - Options for initialization
 */
export function initializeVizelMarkdownContent(
  editor: Editor,
  markdown: string,
  options: { transformDiagrams?: boolean } = {}
): void {
  const { transformDiagrams = true } = options;
  setVizelMarkdown(editor, markdown, { transformDiagrams });
}

/**
 * Create debounced markdown sync handlers.
 * This is a framework-agnostic helper that frameworks can use to implement their own hooks.
 *
 * @param options - Sync options
 * @returns Object with handlers and state
 *
 * @example
 * ```typescript
 * const sync = createVizelMarkdownSyncHandlers({
 *   debounceMs: 300,
 *   transformDiagrams: true,
 * });
 *
 * // In onUpdate callback:
 * sync.handleUpdate(editor);
 *
 * // Get current markdown:
 * console.log(sync.getMarkdown());
 *
 * // Set markdown:
 * sync.setMarkdown(editor, "# New content");
 *
 * // Cleanup:
 * sync.destroy();
 * ```
 */
export interface VizelMarkdownSyncHandlers {
  /** Handle editor update (call in onUpdate callback) */
  handleUpdate: (editor: Editor) => void;
  /** Get current markdown content */
  getMarkdown: () => string;
  /** Set markdown content to editor */
  setMarkdown: (editor: Editor, markdown: string) => void;
  /** Check if export is pending */
  isPending: () => boolean;
  /** Force immediate export (flush pending) */
  flush: (editor: Editor) => void;
  /** Cleanup (cancel pending timers) */
  destroy: () => void;
}

/**
 * Create markdown sync handlers for framework implementations.
 */
export function createVizelMarkdownSyncHandlers(
  options: VizelMarkdownSyncOptions = {}
): VizelMarkdownSyncHandlers {
  const { debounceMs = VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS, transformDiagrams = true } = options;

  let currentMarkdown = "";
  let pending = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = (editor: Editor): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    currentMarkdown = getVizelMarkdown(editor);
    pending = false;
  };

  const handleUpdate = (editor: Editor): void => {
    if (debounceMs === 0) {
      // Cancel any in-flight debounced timer so `pending` doesn't stay true
      // after a subsequent `debounceMs === 0` call. The previous shape left
      // a stale `setTimeout` running, which made `isPending()` lie about
      // the export status.
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pending = false;
      currentMarkdown = getVizelMarkdown(editor);
      return;
    }

    pending = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      currentMarkdown = getVizelMarkdown(editor);
      pending = false;
      timeoutId = null;
    }, debounceMs);
  };

  const setMarkdownFn = (editor: Editor, markdown: string): void => {
    // Cancel any pending export
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pending = false;

    // Set the markdown content
    setVizelMarkdown(editor, markdown, { transformDiagrams });

    // Update current markdown
    currentMarkdown = markdown;
  };

  return {
    handleUpdate,
    getMarkdown: () => currentMarkdown,
    setMarkdown: setMarkdownFn,
    isPending: () => pending,
    flush,
    destroy: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
