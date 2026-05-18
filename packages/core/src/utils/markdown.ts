import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelMarkdownSyncOptions } from "../types.ts";
import {
  convertVizelCodeBlocksToDiagrams,
  transformVizelDiagramCodeBlocks,
  type VizelContentNode,
} from "./editorHelpers.ts";
import { emitVizelError, VizelError } from "./errorHandling.ts";

/**
 * Default debounce delay for markdown export in milliseconds.
 */
export const VIZEL_DEFAULT_MARKDOWN_DEBOUNCE_MS = 300;

/**
 * Editor with markdown export capability (provided by @tiptap/markdown).
 */
interface EditorWithMarkdownExport {
  getMarkdown: () => string;
}

/**
 * Editor with markdown storage for parsing (provided by @tiptap/markdown).
 */
interface EditorWithMarkdownStorage {
  markdown: { parse: (md: string) => JSONContent };
}

/**
 * Type guard: check if the editor has markdown export (getMarkdown method).
 */
function hasMarkdownExport(editor: Editor): editor is Editor & EditorWithMarkdownExport {
  const editorRecord = editor as unknown as Record<string, unknown>;
  return "getMarkdown" in editor && typeof editorRecord.getMarkdown === "function";
}

/**
 * Type guard: check if the editor has markdown storage with parse capability.
 */
function hasMarkdownStorage(editor: Editor): editor is Editor & EditorWithMarkdownStorage {
  const editorRecord = editor as unknown as Record<string, unknown>;
  if (!("markdown" in editor)) return false;

  const storage = editorRecord.markdown;
  if (typeof storage !== "object" || storage === null) return false;

  const storageRecord = storage as Record<string, unknown>;
  return "parse" in storage && typeof storageRecord.parse === "function";
}

/**
 * Get markdown content from the editor.
 * Returns empty string if markdown extension is not enabled.
 *
 * @param editor - The editor instance
 * @param onError - Optional callback invoked when the markdown extension is missing.
 *   When omitted, the error is logged via `console.error` (the `emitVizelError` default).
 */
export function getVizelMarkdown(
  editor: Editor | null | undefined,
  onError?: (err: VizelError) => void
): string {
  if (!editor) return "";
  if (!hasMarkdownExport(editor)) {
    emitVizelError(
      new VizelError(
        "INVALID_EXTENSION",
        "Markdown extension is not loaded on this editor. Ensure the editor was created with `createVizelExtensions` (Markdown is always-on)."
      ),
      onError
    );
    return "";
  }
  return editor.getMarkdown();
}

/**
 * Set markdown content to the editor.
 * Optionally transforms diagram code blocks to diagram nodes.
 *
 * Returns `true` if the operation succeeded, `false` if the editor is missing
 * or the markdown extension is not enabled. When `false` is returned, a
 * {@link VizelError} with code `INVALID_EXTENSION` is emitted via the
 * `onError` callback (or `console.error` when no callback is supplied).
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

  const { transformDiagrams = true, onError } = options;

  if (!hasMarkdownExport(editor)) {
    emitVizelError(
      new VizelError(
        "INVALID_EXTENSION",
        "Markdown extension is not loaded on this editor. Ensure the editor was created with `createVizelExtensions` (Markdown is always-on)."
      ),
      onError
    );
    return false;
  }

  // Set content using markdown contentType
  editor.commands.setContent(markdown, { contentType: "markdown" } as Parameters<
    typeof editor.commands.setContent
  >[1]);

  // Transform diagram code blocks if enabled
  if (transformDiagrams) {
    convertVizelCodeBlocksToDiagrams(editor);
  }

  return true;
}

/**
 * Parse markdown to JSON content.
 * Returns null if markdown extension is not enabled.
 *
 * @param editor - The editor instance (needed for markdown extension access)
 * @param markdown - The markdown content to parse
 * @param options - Options for parsing
 * @returns The parsed JSON content, or null if parsing failed
 */
export function parseVizelMarkdown(
  editor: Editor | null | undefined,
  markdown: string,
  options: { transformDiagrams?: boolean; onError?: (err: VizelError) => void } = {}
): JSONContent | null {
  if (!editor) return null;

  const { transformDiagrams = true, onError } = options;

  if (!hasMarkdownStorage(editor)) {
    emitVizelError(
      new VizelError(
        "INVALID_EXTENSION",
        "Markdown extension is not loaded on this editor. Ensure the editor was created with `createVizelExtensions` (Markdown is always-on)."
      ),
      onError
    );
    return null;
  }

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

  // Use setContent with markdown contentType
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
