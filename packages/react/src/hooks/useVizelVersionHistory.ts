import {
  createVizelVersionHistoryHandlers,
  type Editor,
  VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS,
  type VizelVersionHistoryOptions,
  type VizelVersionHistoryState,
  type VizelVersionSnapshot,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Version history hook result
 */
export interface UseVizelVersionHistoryResult {
  /** All stored snapshots (newest first) */
  snapshots: VizelVersionSnapshot[];
  /** Whether history is loading */
  isLoading: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Save current document as a new version */
  saveVersion: (description?: string, author?: string) => Promise<VizelVersionSnapshot | null>;
  /** Restore document to a specific version */
  restoreVersion: (versionId: string) => Promise<boolean>;
  /** Load all versions from storage */
  loadVersions: () => Promise<VizelVersionSnapshot[]>;
  /** Delete a specific version */
  deleteVersion: (versionId: string) => Promise<void>;
  /** Delete all versions */
  clearVersions: () => Promise<void>;
}

/**
 * Hook for managing document version history.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Version history configuration options
 * @returns Version history state and controls
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const editor = useVizelEditor({ ... });
 *   const { snapshots, saveVersion, restoreVersion } = useVizelVersionHistory(
 *     () => editor,
 *     { maxVersions: 20, key: 'my-doc-versions' }
 *   );
 *
 *   return (
 *     <div>
 *       <VizelEditor editor={editor} />
 *       <button onClick={() => saveVersion("Manual save")}>Save Version</button>
 *       <ul>
 *         {snapshots.map(s => (
 *           <li key={s.id}>
 *             {s.description} - {new Date(s.timestamp).toLocaleString()}
 *             <button onClick={() => restoreVersion(s.id)}>Restore</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVizelVersionHistory(
  getEditor: () => Editor | null | undefined,
  options: VizelVersionHistoryOptions = {}
): UseVizelVersionHistoryResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const enabled = options.enabled ?? VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS.enabled;
  const maxVersions = options.maxVersions ?? VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS.maxVersions;
  const storage = options.storage ?? VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS.storage;
  const key = options.key ?? VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS.key;

  const [state, setState] = useState<VizelVersionHistoryState>({
    snapshots: [],
    isLoading: false,
    error: null,
  });

  const getEditorRef = useRef(getEditor);
  getEditorRef.current = getEditor;

  const handleStateChange = useCallback((partial: Partial<VizelVersionHistoryState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handlers = useMemo(
    () =>
      createVizelVersionHistoryHandlers(
        () => getEditorRef.current(),
        {
          enabled,
          maxVersions,
          storage,
          key,
          onSave: (snapshot) => optionsRef.current.onSave?.(snapshot),
          onError: (error) => optionsRef.current.onError?.(error),
          onRestore: (snapshot) => optionsRef.current.onRestore?.(snapshot),
        },
        handleStateChange
      ),
    [enabled, maxVersions, storage, key, handleStateChange]
  );

  // Track editor value (stable reference) instead of getEditor (unstable function)
  const editor = getEditor();

  // Load versions when editor becomes available
  useEffect(() => {
    if (editor && enabled) {
      handlers.loadVersions();
    }
  }, [editor, enabled, handlers]);

  const saveVersion = useCallback(
    (description?: string, author?: string) => handlers.saveVersion(description, author),
    [handlers]
  );

  const restoreVersion = useCallback(
    (versionId: string) => handlers.restoreVersion(versionId),
    [handlers]
  );

  const loadVersions = useCallback(() => handlers.loadVersions(), [handlers]);

  const deleteVersion = useCallback(
    (versionId: string) => handlers.deleteVersion(versionId),
    [handlers]
  );

  const clearVersions = useCallback(() => handlers.clearVersions(), [handlers]);

  return {
    snapshots: state.snapshots,
    isLoading: state.isLoading,
    error: state.error,
    saveVersion,
    restoreVersion,
    loadVersions,
    deleteVersion,
    clearVersions,
  };
}
