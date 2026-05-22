import {
  createVizelMarkdownSyncHandlers,
  type Editor,
  getVizelMarkdown,
  type VizelMarkdownSyncHandlers,
  type VizelMarkdownSyncOptions,
  vizelCancelAnimationFrame,
  vizelRequestAnimationFrame,
} from "@vizel/core";
import type { ComputedRef, ShallowRef } from "vue";
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";

export interface UseVizelMarkdownOptions extends VizelMarkdownSyncOptions {
  /**
   * Initial markdown value. If provided, this will be set to the editor on mount.
   */
  initialValue?: string;
}

export interface UseVizelMarkdownResult {
  /**
   * Current markdown content (reactive, read-only).
   *
   * Updates with debounce when editor content changes. Use `setMarkdown` to
   * write — the ref is intentionally read-only so accidental writes via
   * `markdown.value = "..."` cannot desynchronize the editor and the cached
   * markdown.
   */
  markdown: Readonly<ShallowRef<string>>;
  /**
   * Set markdown content to the editor.
   * Automatically transforms diagram code blocks if transformDiagrams is enabled.
   */
  setMarkdown: (markdown: string) => void;
  /**
   * Whether markdown export is currently pending (debounced).
   */
  isPending: ComputedRef<boolean>;
  /**
   * Force immediate export (flush pending debounced export).
   */
  flush: () => void;
}

/**
 * Vue composable for bidirectional Markdown synchronization with the editor.
 *
 * @param getEditor - Function to get the editor instance
 * @param options - Sync options
 * @returns Markdown state and control functions
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, useVizelMarkdown, VizelEditor } from '@vizel/vue';
 *
 * const editor = useVizelEditor();
 * const { markdown, setMarkdown, isPending } = useVizelMarkdown(() => editor.value, {
 *   debounceMs: 300,
 * });
 * </script>
 *
 * <template>
 *   <VizelEditor :editor="editor" />
 *   <textarea
 *     :value="markdown"
 *     @input="setMarkdown(($event.target as HTMLTextAreaElement).value)"
 *   />
 *   <span v-if="isPending">Syncing...</span>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * // With initial markdown value
 * const { markdown, setMarkdown } = useVizelMarkdown(() => editor.value, {
 *   initialValue: "# Hello World",
 *   transformDiagrams: true,
 * });
 * </script>
 * ```
 */
export function useVizelMarkdown(
  getEditor: () => Editor | null | undefined,
  options: UseVizelMarkdownOptions = {}
): UseVizelMarkdownResult {
  const { initialValue, ...syncOptions } = options;

  // `shallowRef` is sufficient because the value is always a primitive
  // `string`; deep reactivity would only add overhead. Exposing the ref as
  // `Readonly<ShallowRef<string>>` in the return signature signals that
  // consumers must mutate via `setMarkdown`.
  const markdown = shallowRef(initialValue ?? "");
  const pendingState = shallowRef(false);

  // Create sync handlers — held in a ref-object so the lazy initializer can
  // memoize without a mutable let.
  const handlersRef: { current: VizelMarkdownSyncHandlers | null } = { current: null };

  const initHandlers = (): VizelMarkdownSyncHandlers => {
    if (!handlersRef.current) {
      handlersRef.current = createVizelMarkdownSyncHandlers(syncOptions);
    }
    return handlersRef.current;
  };

  // Track the last `initialValue` we applied across watcher re-runs so
  // Suspense-resolved updates apply while no-op re-renders stay quiet.
  const lastInitialApplied: { value: string | undefined } = { value: undefined };

  // Watch for editor availability
  watch(
    getEditor,
    (editor, _oldEditor, onCleanup) => {
      if (!editor) return;

      const h = initHandlers();

      // Initial value setup. The previous single latch ignored every change
      // after the first apply, leaving editors blank when the server-side
      // markdown arrived asynchronously (Suspense, SWR, etc.). Track the
      // last applied value so repeated re-renders with the same value remain
      // no-ops while genuine updates still propagate.
      if (initialValue === undefined) {
        if (lastInitialApplied.value === undefined) {
          markdown.value = getVizelMarkdown(editor);
          lastInitialApplied.value = "";
        }
      } else if (lastInitialApplied.value !== initialValue) {
        h.setMarkdown(editor, initialValue);
        markdown.value = initialValue;
        lastInitialApplied.value = initialValue;
      }

      // Subscribe to editor updates (every time editor changes)
      const rafState: { id: number | null } = { id: null };

      const handleUpdate = () => {
        h.handleUpdate(editor);
        pendingState.value = h.isPending();

        // Cancel any pending rAF before scheduling a new one
        vizelCancelAnimationFrame(rafState.id);

        // Schedule state update after debounce
        const checkPending = () => {
          if (h.isPending()) {
            rafState.id = vizelRequestAnimationFrame(checkPending);
          } else {
            rafState.id = null;
            markdown.value = h.getMarkdown();
            pendingState.value = false;
          }
        };
        rafState.id = vizelRequestAnimationFrame(checkPending);
      };

      editor.on("update", handleUpdate);

      // Cleanup when watch re-runs or component unmounts
      onCleanup(() => {
        // Flush any pending debounced export before detaching so editor swaps
        // (or unmount) do not drop unsynced markdown. Matches the Svelte rune.
        if (h.isPending()) {
          h.flush(editor);
          markdown.value = h.getMarkdown();
          pendingState.value = false;
        }
        editor.off("update", handleUpdate);
        vizelCancelAnimationFrame(rafState.id);
      });
    },
    { immediate: true }
  );

  // Cleanup on unmount
  onBeforeUnmount(() => {
    handlersRef.current?.destroy();
  });

  const setMarkdown = (newMarkdown: string) => {
    const editor = getEditor();
    if (!editor) return;

    const h = initHandlers();
    h.setMarkdown(editor, newMarkdown);
    markdown.value = newMarkdown;
    pendingState.value = false;
  };

  const flush = () => {
    const editor = getEditor();
    if (!editor) return;

    const h = initHandlers();
    h.flush(editor);
    markdown.value = h.getMarkdown();
    pendingState.value = false;
  };

  return {
    markdown,
    setMarkdown,
    isPending: computed(() => pendingState.value),
    flush,
  };
}
