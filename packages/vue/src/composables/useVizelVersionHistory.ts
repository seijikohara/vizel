import {
  createVizelVersionHistoryHandlers,
  type Editor,
  VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS,
  type VizelVersionHistoryOptions,
  type VizelVersionHistoryState,
  type VizelVersionSnapshot,
} from "@vizel/core";
import { type ComputedRef, computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";

/**
 * Version history composable result
 */
export interface UseVizelVersionHistoryResult {
  /** All stored snapshots (newest first) */
  snapshots: ComputedRef<VizelVersionSnapshot[]>;
  /** Whether history is loading */
  isLoading: ComputedRef<boolean>;
  /** Last error that occurred */
  error: ComputedRef<Error | null>;
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
 * Composable for managing document version history.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Version history configuration options
 * @returns Version history state and controls
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, useVizelVersionHistory } from '@vizel/vue';
 *
 * const editor = useVizelEditor({ ... });
 * const { snapshots, saveVersion, restoreVersion } = useVizelVersionHistory(
 *   () => editor.value,
 *   { maxVersions: 20 }
 * );
 * </script>
 * ```
 */
export function useVizelVersionHistory(
  getEditor: () => Editor | null | undefined,
  options: VizelVersionHistoryOptions = {}
): UseVizelVersionHistoryResult {
  const opts = { ...VIZEL_DEFAULT_VERSION_HISTORY_OPTIONS, ...options };

  const state = reactive<VizelVersionHistoryState>({
    snapshots: [],
    isLoading: false,
    error: null,
  });

  let handlers: ReturnType<typeof createVizelVersionHistoryHandlers> | null = null;

  function handleStateChange(partial: Partial<VizelVersionHistoryState>) {
    if (partial.snapshots !== undefined) state.snapshots = partial.snapshots;
    if (partial.isLoading !== undefined) state.isLoading = partial.isLoading;
    if (partial.error !== undefined) state.error = partial.error;
  }

  function setup() {
    handlers = createVizelVersionHistoryHandlers(getEditor, opts, handleStateChange);
    const editor = getEditor();
    if (editor && opts.enabled) {
      handlers.loadVersions();
    }
  }

  onMounted(() => {
    setup();
  });

  watch(
    () => getEditor(),
    () => {
      setup();
    }
  );

  onBeforeUnmount(() => {
    handlers = null;
  });

  async function saveVersion(
    description?: string,
    author?: string
  ): Promise<VizelVersionSnapshot | null> {
    return (await handlers?.saveVersion(description, author)) ?? null;
  }

  async function restoreVersion(versionId: string): Promise<boolean> {
    return (await handlers?.restoreVersion(versionId)) ?? false;
  }

  async function loadVersions(): Promise<VizelVersionSnapshot[]> {
    return (await handlers?.loadVersions()) ?? [];
  }

  async function deleteVersion(versionId: string): Promise<void> {
    await handlers?.deleteVersion(versionId);
  }

  async function clearVersions(): Promise<void> {
    await handlers?.clearVersions();
  }

  return {
    snapshots: computed(() => state.snapshots),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    saveVersion,
    restoreVersion,
    loadVersions,
    deleteVersion,
    clearVersions,
  };
}
