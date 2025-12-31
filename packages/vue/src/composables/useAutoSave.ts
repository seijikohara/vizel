import {
  type AutoSaveOptions,
  type AutoSaveState,
  createAutoSaveHandlers,
  DEFAULT_AUTO_SAVE_OPTIONS,
  type Editor,
  type JSONContent,
  type SaveStatus,
} from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, type Ref, reactive, watch } from "vue";

/**
 * Auto-save composable result
 */
export interface UseAutoSaveResult {
  /** Current save status */
  status: Ref<SaveStatus>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: Ref<boolean>;
  /** Timestamp of last successful save */
  lastSaved: Ref<Date | null>;
  /** Last error that occurred */
  error: Ref<Error | null>;
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
 * import { useVizelEditor, useAutoSave, EditorContent, SaveIndicator } from '@vizel/vue';
 *
 * const editor = useVizelEditor({ ... });
 * const { status, lastSaved, save } = useAutoSave(() => editor.value, {
 *   debounceMs: 2000,
 *   storage: 'localStorage',
 *   key: 'my-document',
 * });
 * </script>
 *
 * <template>
 *   <EditorContent :editor="editor" />
 *   <SaveIndicator :status="status" :lastSaved="lastSaved" />
 * </template>
 * ```
 */
export function useAutoSave(
  getEditor: () => Editor | null | undefined,
  options: AutoSaveOptions = {}
): UseAutoSaveResult {
  const opts = { ...DEFAULT_AUTO_SAVE_OPTIONS, ...options };

  const state = reactive<AutoSaveState>({
    status: "saved",
    hasUnsavedChanges: false,
    lastSaved: null,
    error: null,
  });

  let currentEditor: Editor | null = null;
  let handlers: ReturnType<typeof createAutoSaveHandlers> | null = null;

  function handleStateChange(partial: Partial<AutoSaveState>) {
    if (partial.status !== undefined) state.status = partial.status;
    if (partial.hasUnsavedChanges !== undefined)
      state.hasUnsavedChanges = partial.hasUnsavedChanges;
    if (partial.lastSaved !== undefined) state.lastSaved = partial.lastSaved;
    if (partial.error !== undefined) state.error = partial.error;
  }

  function subscribe() {
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

    handlers = createAutoSaveHandlers(() => currentEditor, opts, handleStateChange);

    currentEditor.on("update", handlers.handleUpdate);
  }

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
