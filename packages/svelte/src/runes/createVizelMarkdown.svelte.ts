import {
  createVizelMarkdownSyncHandlers,
  type Editor,
  getVizelMarkdown,
  type VizelMarkdownSyncHandlers,
  type VizelMarkdownSyncOptions,
  vizelCancelAnimationFrame,
  vizelRequestAnimationFrame,
} from "@vizel/core";

export interface CreateVizelMarkdownOptions extends VizelMarkdownSyncOptions {
  /**
   * Initial markdown value. If provided, this will be set to the editor on mount.
   */
  initialValue?: string;
}

export interface CreateVizelMarkdownResult {
  /**
   * Current markdown content (reactive getter).
   * Updates with debounce when editor content changes.
   */
  readonly current: string;
  /**
   * Set markdown content to the editor.
   * Automatically transforms diagram code blocks if transformDiagrams is enabled.
   */
  setMarkdown: (markdown: string) => void;
  /**
   * Whether markdown export is currently pending (debounced).
   */
  readonly isPending: boolean;
  /**
   * Force immediate export (flush pending debounced export).
   */
  flush: () => void;
}

/**
 * Svelte 5 rune for bidirectional Markdown synchronization with the editor.
 *
 * @param getEditor - Function to get the editor instance
 * @param options - Sync options
 * @returns Markdown state and control functions
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, createVizelMarkdown, VizelEditor } from '@vizel/svelte';
 *
 * const editorState = createVizelEditor();
 * const markdownState = createVizelMarkdown(() => editorState.current, {
 *   debounceMs: 300,
 * });
 * </script>
 *
 * <VizelEditor editor={editorState.current} />
 * <textarea
 *   value={markdownState.current}
 *   oninput={(e) => markdownState.setMarkdown(e.currentTarget.value)}
 * />
 * {#if markdownState.isPending}
 *   <span>Syncing...</span>
 * {/if}
 * ```
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * // With initial markdown value
 * const markdownState = createVizelMarkdown(() => editorState.current, {
 *   initialValue: "# Hello World",
 *   transformDiagrams: true,
 * });
 * </script>
 * ```
 */
export function createVizelMarkdown(
  getEditor: () => Editor | null | undefined,
  options: CreateVizelMarkdownOptions = {}
): CreateVizelMarkdownResult {
  const { initialValue, ...syncOptions } = options;

  let markdown = $state(initialValue ?? "");
  let isPending = $state(false);

  // Create sync handlers
  let handlers: VizelMarkdownSyncHandlers | null = null;

  const initHandlers = () => {
    if (!handlers) {
      handlers = createVizelMarkdownSyncHandlers(syncOptions);
    }
    return handlers;
  };

  // Track the last `initialValue` we applied across effect re-runs so
  // Suspense-resolved / lazy-loaded updates apply while no-op re-renders
  // stay quiet. A primitive `let` is allowed in `.svelte.ts` files.
  let lastInitialApplied: string | undefined;

  // Watch for editor availability and subscribe to updates
  $effect(() => {
    const editor = getEditor();
    if (!editor) return;

    const h = initHandlers();

    // Initialize markdown on first editor availability, then re-apply when
    // the caller swaps `initialValue` (e.g. async data resolves later).
    if (initialValue === undefined) {
      if (lastInitialApplied === undefined) {
        markdown = getVizelMarkdown(editor);
        lastInitialApplied = "";
      }
    } else if (lastInitialApplied !== initialValue) {
      h.setMarkdown(editor, initialValue);
      markdown = initialValue;
      lastInitialApplied = initialValue;
    }

    // Subscribe to editor updates
    let rafId: number | null = null;

    const handleUpdate = () => {
      h.handleUpdate(editor);
      isPending = h.isPending();

      // Cancel any pending rAF before scheduling a new one
      vizelCancelAnimationFrame(rafId);

      // Schedule state update after debounce
      const checkPending = () => {
        if (h.isPending()) {
          rafId = vizelRequestAnimationFrame(checkPending);
        } else {
          rafId = null;
          markdown = h.getMarkdown();
          isPending = false;
        }
      };
      rafId = vizelRequestAnimationFrame(checkPending);
    };

    editor.on("update", handleUpdate);

    return () => {
      // Flush any pending debounced export before destroying so editor swaps
      // do not drop unsynced markdown.
      if (h.isPending()) {
        h.flush(editor);
        markdown = h.getMarkdown();
      }
      editor.off("update", handleUpdate);
      vizelCancelAnimationFrame(rafId);
      handlers?.destroy();
      handlers = null;
      isPending = false;
    };
  });

  const setMarkdown = (newMarkdown: string) => {
    const editor = getEditor();
    if (!editor) return;

    const h = initHandlers();
    h.setMarkdown(editor, newMarkdown);
    markdown = newMarkdown;
    isPending = false;
  };

  const flush = () => {
    const editor = getEditor();
    if (!editor) return;

    const h = initHandlers();
    h.flush(editor);
    markdown = h.getMarkdown();
    isPending = false;
  };

  return {
    get current() {
      return markdown;
    },
    setMarkdown,
    get isPending() {
      return isPending;
    },
    flush,
  };
}
