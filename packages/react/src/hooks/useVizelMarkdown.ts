import type { Editor } from "@tiptap/core";
import {
  createVizelMarkdownSyncHandlers,
  getVizelMarkdown,
  type VizelMarkdownSyncHandlers,
  type VizelMarkdownSyncOptions,
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
 * @param editor - The editor instance
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
  editor: Editor | null,
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

  // Track if initial value has been set
  const initialSetRef = useRef(false);

  // Set initial markdown when editor is ready
  useEffect(() => {
    if (!editor || initialSetRef.current) return;

    if (initialValue !== undefined) {
      handlersRef.current?.setMarkdown(editor, initialValue);
      setMarkdownState(initialValue);
    } else {
      // Get initial markdown from editor
      const currentMarkdown = getVizelMarkdown(editor);
      setMarkdownState(currentMarkdown);
    }

    initialSetRef.current = true;
  }, [editor, initialValue]);

  // Subscribe to editor updates
  useEffect(() => {
    if (!editor) return;

    const handlers = handlersRef.current;
    if (!handlers) return;

    const handleUpdate = () => {
      handlers.handleUpdate(editor);
      setIsPending(handlers.isPending());

      // Schedule state update after debounce
      const checkPending = () => {
        if (handlers.isPending()) {
          requestAnimationFrame(checkPending);
        } else {
          setMarkdownState(handlers.getMarkdown());
          setIsPending(false);
        }
      };
      requestAnimationFrame(checkPending);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlersRef.current?.destroy();
    };
  }, []);

  const setMarkdown = useCallback(
    (newMarkdown: string) => {
      if (!editor) return;
      handlersRef.current?.setMarkdown(editor, newMarkdown);
      setMarkdownState(newMarkdown);
      setIsPending(false);
    },
    [editor]
  );

  const flush = useCallback(() => {
    if (!editor) return;
    handlersRef.current?.flush(editor);
    setMarkdownState(handlersRef.current?.getMarkdown() ?? "");
    setIsPending(false);
  }, [editor]);

  return {
    markdown,
    setMarkdown,
    isPending,
    flush,
  };
}
