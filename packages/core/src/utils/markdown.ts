import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelMarkdownSyncOptions } from "../types.ts";
import {
  convertVizelCodeBlocksToDiagrams,
  transformVizelDiagramCodeBlocks,
  type VizelContentNode,
} from "./editorHelpers.ts";

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
  return (
    "getMarkdown" in editor &&
    typeof (editor as EditorWithMarkdownExport).getMarkdown === "function"
  );
}

/**
 * Type guard: check if the editor has markdown storage with parse capability.
 */
function hasMarkdownStorage(editor: Editor): editor is Editor & EditorWithMarkdownStorage {
  if (!("markdown" in editor)) return false;
  const storage = (editor as Editor & { markdown: unknown }).markdown;
  return (
    typeof storage === "object" &&
    storage !== null &&
    "parse" in storage &&
    typeof (storage as EditorWithMarkdownStorage["markdown"]).parse === "function"
  );
}

/**
 * Get markdown content from the editor.
 * Returns empty string if markdown extension is not enabled.
 */
export function getVizelMarkdown(editor: Editor | null | undefined): string {
  if (!editor) return "";
  if (!hasMarkdownExport(editor)) {
    console.warn(
      "[Vizel] Markdown extension is not enabled. Enable it via features.markdown option."
    );
    return "";
  }
  return editor.getMarkdown();
}

/**
 * Set markdown content to the editor.
 * Optionally transforms diagram code blocks to diagram nodes.
 *
 * @param editor - The editor instance
 * @param markdown - The markdown content to set
 * @param options - Options for setting content
 */
export function setVizelMarkdown(
  editor: Editor | null | undefined,
  markdown: string,
  options: { transformDiagrams?: boolean } = {}
): void {
  if (!editor) return;

  const { transformDiagrams = true } = options;

  if (!hasMarkdownExport(editor)) {
    console.warn(
      "[Vizel] Markdown extension is not enabled. Enable it via features.markdown option."
    );
    return;
  }

  // Set content using markdown contentType
  editor.commands.setContent(markdown, { contentType: "markdown" } as Parameters<
    typeof editor.commands.setContent
  >[1]);

  // Transform diagram code blocks if enabled
  if (transformDiagrams) {
    convertVizelCodeBlocksToDiagrams(editor);
  }
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
  options: { transformDiagrams?: boolean } = {}
): JSONContent | null {
  if (!editor) return null;

  const { transformDiagrams = true } = options;

  if (!hasMarkdownStorage(editor)) {
    console.warn(
      "[Vizel] Markdown extension is not enabled. Enable it via features.markdown option."
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
