import {
  type AutoSaveOptions,
  type AutoSaveState,
  createAutoSaveHandlers,
  DEFAULT_AUTO_SAVE_OPTIONS,
  type Editor,
  type JSONContent,
  type SaveStatus,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Auto-save hook result
 */
export interface UseAutoSaveResult {
  /** Current save status */
  status: SaveStatus;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Last error that occurred */
  error: Error | null;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Restore content from storage */
  restore: () => Promise<JSONContent | null>;
}

/**
 * Hook for auto-saving editor content with debouncing.
 *
 * @param editor - The editor instance
 * @param options - Auto-save configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const editor = useVizelEditor({ ... });
 *   const { status, lastSaved, save } = useAutoSave(editor, {
 *     debounceMs: 2000,
 *     storage: 'localStorage',
 *     key: 'my-document',
 *   });
 *
 *   return (
 *     <div>
 *       <EditorContent editor={editor} />
 *       <SaveIndicator status={status} lastSaved={lastSaved} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoSave(
  editor: Editor | null,
  options: AutoSaveOptions = {}
): UseAutoSaveResult {
  // Store full options in ref to access callbacks without recreating handlers
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Merge with defaults - use individual primitives as dependencies to avoid
  // recreating when object reference changes but values are the same
  const enabled = options.enabled ?? DEFAULT_AUTO_SAVE_OPTIONS.enabled;
  const debounceMs = options.debounceMs ?? DEFAULT_AUTO_SAVE_OPTIONS.debounceMs;
  const storage = options.storage ?? DEFAULT_AUTO_SAVE_OPTIONS.storage;
  const key = options.key ?? DEFAULT_AUTO_SAVE_OPTIONS.key;

  const [state, setState] = useState<AutoSaveState>({
    status: "saved",
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null,
  });

  // Keep a ref to the editor for the handlers
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const handleStateChange = useCallback((partial: Partial<AutoSaveState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Create handlers with stable dependencies - use optionsRef for callbacks (onSave, onError, etc.)
  // that don't need to trigger recreation
  const handlers = useMemo(
    () =>
      createAutoSaveHandlers(
        () => editorRef.current,
        {
          enabled,
          debounceMs,
          storage,
          key,
          // Access callbacks through ref to avoid dependency on them
          onSave: (content) => optionsRef.current.onSave?.(content),
          onError: (error) => optionsRef.current.onError?.(error),
          onRestore: (content) => optionsRef.current.onRestore?.(content),
        },
        handleStateChange
      ),
    [enabled, debounceMs, storage, key, handleStateChange]
  );

  // Subscribe to editor updates
  useEffect(() => {
    if (!(editor && enabled)) return;

    editor.on("update", handlers.handleUpdate);

    return () => {
      editor.off("update", handlers.handleUpdate);
      handlers.cancel();
    };
  }, [editor, enabled, handlers]);

  const save = useCallback(async () => {
    await handlers.saveNow();
  }, [handlers]);

  const restore = useCallback(async () => {
    return await handlers.restore();
  }, [handlers]);

  return {
    status: state.status,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,
    error: state.error,
    save,
    restore,
  };
}
