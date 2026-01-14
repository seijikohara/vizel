import {
  createVizelAutoSaveHandlers,
  type Editor,
  type JSONContent,
  VIZEL_DEFAULT_AUTO_SAVE_OPTIONS,
  type VizelAutoSaveOptions,
  type VizelAutoSaveState,
  type VizelSaveStatus,
} from "@vizel/core";
import { type ComputedRef, computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";

/**
 * Auto-save composable result
 */
export interface UseVizelAutoSaveResult {
  /** Current save status */
  status: ComputedRef<VizelSaveStatus>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: ComputedRef<boolean>;
  /** Timestamp of last successful save */
  lastSaved: ComputedRef<Date | null>;
  /** Last error that occurred */
  error: ComputedRef<Error | null>;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Restore content from storage */
  restore: () => Promise<JSONContent | null>;
}

/**
 * Composable for auto-saving editor content with debouncing.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Auto-save configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, useVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/vue';
 *
 * const editor = useVizelEditor({ ... });
 * const { status, lastSaved, save } = useVizelAutoSave(() => editor.value, {
 *   debounceMs: 2000,
 *   storage: 'localStorage',
 *   key: 'my-document',
 * });
 * </script>
 *
 * <template>
 *   <VizelEditor :editor="editor" />
 *   <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
 * </template>
 * ```
 */
export function useVizelAutoSave(
  getEditor: () => Editor | null | undefined,
  options: VizelAutoSaveOptions = {}
): UseVizelAutoSaveResult {
  const opts = { ...VIZEL_DEFAULT_AUTO_SAVE_OPTIONS, ...options };

  const state = reactive<VizelAutoSaveState>({
    status: "saved",
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null,
  });

  let currentEditor: Editor | null = null;
  let handlers: ReturnType<typeof createVizelAutoSaveHandlers> | null = null;

  const handleStateChange = (partial: Partial<VizelAutoSaveState>) => {
    if (partial.status !== undefined) state.status = partial.status;
    if (partial.hasUnsavedChanges !== undefined)
      state.hasUnsavedChanges = partial.hasUnsavedChanges;
    if (partial.lastSaved !== undefined) state.lastSaved = partial.lastSaved;
    if (partial.error !== undefined) state.error = partial.error;
  };

  const subscribe = () => {
    const editor = getEditor();

    // Unsubscribe from previous editor
    if (currentEditor && handlers) {
      currentEditor.off("update", handlers.handleUpdate);
      handlers.cancel();
    }

    currentEditor = editor ?? null;

    if (!(currentEditor && opts.enabled)) {
      handlers = null;
      return;
    }

    handlers = createVizelAutoSaveHandlers(() => currentEditor, opts, handleStateChange);

    currentEditor.on("update", handlers.handleUpdate);
  };

  onMounted(() => {
    subscribe();
  });

  // Watch for editor changes
  watch(
    () => getEditor(),
    () => {
      subscribe();
    }
  );

  onBeforeUnmount(() => {
    if (currentEditor && handlers) {
      currentEditor.off("update", handlers.handleUpdate);
      handlers.cancel();
    }
  });

  async function save(): Promise<void> {
    await handlers?.saveNow();
  }

  async function restore(): Promise<JSONContent | null> {
    return (await handlers?.restore()) ?? null;
  }

  return {
    status: computed(() => state.status),
    hasUnsavedChanges: computed(() => state.hasUnsavedChanges),
    lastSaved: computed(() => state.lastSaved),
    error: computed(() => state.error),
    save,
    restore,
  };
}
