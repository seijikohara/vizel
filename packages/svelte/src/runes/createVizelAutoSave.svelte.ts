import type { Editor, JSONContent } from "@tiptap/core";
import {
  createVizelAutoSaveHandlers,
  VIZEL_DEFAULT_AUTO_SAVE_OPTIONS,
  type VizelAutoSaveOptions,
  type VizelAutoSaveState,
  type VizelSaveStatus,
} from "@vizel/core";

/**
 * Auto-save rune result
 */
export interface CreateVizelAutoSaveResult {
  /** Current save status */
  readonly status: VizelSaveStatus;
  /** Whether there are unsaved changes */
  readonly hasUnsavedChanges: boolean;
  /** Timestamp of last successful save */
  readonly lastSaved: Date | null;
  /** Last error that occurred */
  readonly error: Error | null;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Restore content from storage */
  restore: () => Promise<JSONContent | null>;
}

/**
 * Svelte 5 rune for auto-saving editor content with debouncing.
 *
 * @param getEditor - Function that returns the editor instance
 * @param options - Auto-save configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, createVizelAutoSave, VizelEditor, VizelSaveIndicator } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({ ... });
 * const autoSave = createVizelAutoSave(() => editor.current, {
 *   debounceMs: 2000,
 *   storage: 'localStorage',
 *   key: 'my-document',
 * });
 * </script>
 *
 * <VizelEditor editor={editor.current} />
 * <VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
 * ```
 */
export function createVizelAutoSave(
  getEditor: () => Editor | null | undefined,
  options: VizelAutoSaveOptions = {}
): CreateVizelAutoSaveResult {
  const opts = { ...VIZEL_DEFAULT_AUTO_SAVE_OPTIONS, ...options };

  let status = $state<VizelSaveStatus>("saved");
  let hasUnsavedChanges = $state(false);
  let lastSaved = $state<Date | null>(null);
  let error = $state<Error | null>(null);

  let currentEditor: Editor | null = null;
  let handlers: ReturnType<typeof createVizelAutoSaveHandlers> | null = null;

  function handleStateChange(partial: Partial<VizelAutoSaveState>) {
    if (partial.status !== undefined) status = partial.status;
    if (partial.hasUnsavedChanges !== undefined) hasUnsavedChanges = partial.hasUnsavedChanges;
    if (partial.lastSaved !== undefined) lastSaved = partial.lastSaved;
    if (partial.error !== undefined) error = partial.error;
  }

  function subscribe(editor: Editor | null | undefined) {
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
  }

  // Watch for editor changes - $effect cleanup handles unmount
  $effect(() => {
    const editor = getEditor();
    subscribe(editor);

    return () => {
      if (currentEditor && handlers) {
        currentEditor.off("update", handlers.handleUpdate);
        handlers.cancel();
      }
    };
  });

  async function save(): Promise<void> {
    await handlers?.saveNow();
  }

  async function restore(): Promise<JSONContent | null> {
    return (await handlers?.restore()) ?? null;
  }

  return {
    get status() {
      return status;
    },
    get hasUnsavedChanges() {
      return hasUnsavedChanges;
    },
    get lastSaved() {
      return lastSaved;
    },
    get error() {
      return error;
    },
    save,
    restore,
  };
}
