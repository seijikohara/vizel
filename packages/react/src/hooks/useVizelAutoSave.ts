import type { Editor, JSONContent } from "@tiptap/core";
import {
  createVizelAutoSaveHandlers,
  VIZEL_DEFAULT_AUTO_SAVE_OPTIONS,
  type VizelAutoSaveOptions,
  type VizelAutoSaveState,
  type VizelSaveStatus,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Auto-save hook result
 */
export interface UseVizelAutoSaveResult {
  /** Current save status */
  status: VizelSaveStatus;
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
 * @param getEditor - Function that returns the editor instance
 * @param options - Auto-save configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const editor = useVizelEditor({ ... });
 *   const { status, lastSaved, save } = useVizelAutoSave(() => editor, {
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
export function useVizelAutoSave(
  getEditor: () => Editor | null | undefined,
  options: VizelAutoSaveOptions = {}
): UseVizelAutoSaveResult {
  // Store full options in ref to access callbacks without recreating handlers
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Merge with defaults - use individual primitives as dependencies to avoid
  // recreating when object reference changes but values are the same
  const enabled = options.enabled ?? VIZEL_DEFAULT_AUTO_SAVE_OPTIONS.enabled;
  const debounceMs = options.debounceMs ?? VIZEL_DEFAULT_AUTO_SAVE_OPTIONS.debounceMs;
  const storage = options.storage ?? VIZEL_DEFAULT_AUTO_SAVE_OPTIONS.storage;
  const key = options.key ?? VIZEL_DEFAULT_AUTO_SAVE_OPTIONS.key;

  const [state, setState] = useState<VizelAutoSaveState>({
    status: "saved",
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null,
  });

  // Keep a ref to the getEditor function for the handlers
  const getEditorRef = useRef(getEditor);
  getEditorRef.current = getEditor;

  const handleStateChange = useCallback((partial: Partial<VizelAutoSaveState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Create handlers with stable dependencies - use optionsRef for callbacks (onSave, onError, etc.)
  // that don't need to trigger recreation
  const handlers = useMemo(
    () =>
      createVizelAutoSaveHandlers(
        () => getEditorRef.current(),
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
    const editor = getEditor();
    if (!(editor && enabled)) return;

    editor.on("update", handlers.handleUpdate);

    return () => {
      editor.off("update", handlers.handleUpdate);
      handlers.cancel();
    };
  }, [getEditor, enabled, handlers]);

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
