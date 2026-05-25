import {
  createVizelMarkdownSyncHandlers,
  type Editor,
  getVizelMarkdown,
  type VizelMarkdownSyncHandlers,
  type VizelMarkdownSyncOptions,
  vizelCancelAnimationFrame,
  vizelRequestAnimationFrame,
} from "@vizel/core";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVizelMarkdownOptions extends VizelMarkdownSyncOptions {
  /**
   * Initial markdown value. If provided, this will be set to the editor on mount.
   */
  initialValue?: string;
}

export interface UseVizelMarkdownResult {
  /**
   * Current markdown content (reactive).
   * Updates with debounce when editor content changes.
   */
  markdown: string;
  /**
   * Set markdown content to the editor.
   * Automatically transforms diagram code blocks if transformDiagrams is enabled.
   */
  setMarkdown: (markdown: string) => void;
  /**
   * Whether markdown export is currently pending (debounced).
   */
  isPending: boolean;
  /**
   * Force immediate export (flush pending debounced export).
   */
  flush: () => void;
}

/**
 * React hook for bidirectional Markdown synchronization with the editor.
 *
 * @param editor - The editor instance, or `null`/`undefined` while it is still initializing.
 * @param options - Sync options
 * @returns Markdown state and control functions
 *
 * @example
 * ```tsx
 * import { useVizelEditor, useVizelMarkdown } from '@vizel/react';
 *
 * function App() {
 *   const editor = useVizelEditor();
 *   const { markdown, setMarkdown, isPending } = useVizelMarkdown(editor, {
 *     debounceMs: 300,
 *   });
 *
 *   return (
 *     <div>
 *       <VizelEditor editor={editor} />
 *       <textarea
 *         value={markdown}
 *         onChange={(e) => setMarkdown(e.target.value)}
 *       />
 *       {isPending && <span>Syncing...</span>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With initial markdown value
 * const { markdown, setMarkdown } = useVizelMarkdown(editor, {
 *   initialValue: "# Hello World",
 *   transformDiagrams: true,
 * });
 * ```
 */
export function useVizelMarkdown(
  editor: Editor | null | undefined,
  options: UseVizelMarkdownOptions = {}
): UseVizelMarkdownResult {
  const { initialValue, ...syncOptions } = options;

  const [markdown, setMarkdownState] = useState(() => initialValue ?? "");
  const [isPending, setIsPending] = useState(false);

  // Create sync handlers
  const handlersRef = useRef<VizelMarkdownSyncHandlers | null>(null);
  if (!handlersRef.current) {
    handlersRef.current = createVizelMarkdownSyncHandlers(syncOptions);
  }

  // Keep a ref to the editor so memoized callbacks can read the latest value
  // without depending on the editor identity.
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Track the last `initialValue` we applied so suspense-resolved updates
  // (data arriving after the first render) are still honored, while
  // re-renders with the same value remain no-ops. The previous single
  // latch ignored every change after the first apply, leaving editors
  // blank when server-side markdown arrived asynchronously.
  const appliedInitialValueRef = useRef<string | undefined>(undefined);

  // Set initial markdown when editor is ready or when `initialValue` changes
  useEffect(() => {
    if (!editor) return;

    if (initialValue === undefined) {
      // Uncontrolled path: pull the current markdown from the editor exactly
      // once so the consumer sees the server-rendered seed value.
      if (appliedInitialValueRef.current === undefined) {
        setMarkdownState(getVizelMarkdown(editor));
        appliedInitialValueRef.current = "";
      }
      return;
    }

    if (appliedInitialValueRef.current === initialValue) return;

    handlersRef.current?.setMarkdown(editor, initialValue);
    setMarkdownState(initialValue);
    appliedInitialValueRef.current = initialValue;
  }, [editor, initialValue]);

  // Subscribe to editor updates
  useEffect(() => {
    if (!editor) return;

    const handlers = handlersRef.current;
    if (!handlers) return;

    const rafState: { id: number | null } = { id: null };

    const handleUpdate = () => {
      handlers.handleUpdate(editor);
      setIsPending(handlers.isPending());

      // Cancel any pending rAF before scheduling a new one
      vizelCancelAnimationFrame(rafState.id);

      // Schedule state update after debounce
      const checkPending = () => {
        if (handlers.isPending()) {
          rafState.id = vizelRequestAnimationFrame(checkPending);
        } else {
          rafState.id = null;
          setMarkdownState(handlers.getMarkdown());
          setIsPending(false);
        }
      };
      rafState.id = vizelRequestAnimationFrame(checkPending);
    };

    editor.on("update", handleUpdate);

    return () => {
      // Flush any pending debounced export before detaching so editor swaps
      // (or unmount) do not drop unsynced markdown. Matches the Svelte rune.
      if (handlers.isPending()) {
        handlers.flush(editor);
        setMarkdownState(handlers.getMarkdown());
        setIsPending(false);
      }
      editor.off("update", handleUpdate);
      vizelCancelAnimationFrame(rafState.id);
    };
  }, [editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlersRef.current?.destroy();
    };
  }, []);

  const setMarkdown = useCallback((newMarkdown: string) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    handlersRef.current?.setMarkdown(currentEditor, newMarkdown);
    setMarkdownState(newMarkdown);
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    handlersRef.current?.flush(currentEditor);
    setMarkdownState(handlersRef.current?.getMarkdown() ?? "");
    setIsPending(false);
  }, []);

  return {
    markdown,
    setMarkdown,
    isPending,
    flush,
  };
}
