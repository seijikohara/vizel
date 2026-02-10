import {
  createVizelMarkdownSyncHandlers,
  type Editor,
  getVizelMarkdown,
  type VizelMarkdownSyncHandlers,
  type VizelMarkdownSyncOptions,
} from "@vizel/core";
import type { ComputedRef, Ref } from "vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";

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
  markdown: Ref<string>;
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

  const markdown = ref(initialValue ?? "");
  const pendingState = ref(false);

  // Create sync handlers
  let handlers: VizelMarkdownSyncHandlers | null = null;

  const initHandlers = (): VizelMarkdownSyncHandlers => {
    if (!handlers) {
      handlers = createVizelMarkdownSyncHandlers(syncOptions);
    }
    return handlers;
  };

  // Track if initial value has been set
  let initialSet = false;

  // Watch for editor availability
  watch(
    getEditor,
    (editor, _oldEditor, onCleanup) => {
      if (!editor) return;

      const h = initHandlers();

      // Initial value setup (only once)
      if (!initialSet) {
        if (initialValue !== undefined) {
          h.setMarkdown(editor, initialValue);
          markdown.value = initialValue;
        } else {
          // Get initial markdown from editor
          markdown.value = getVizelMarkdown(editor);
        }
        initialSet = true;
      }

      // Subscribe to editor updates (every time editor changes)
      let rafId: number | null = null;

      const handleUpdate = () => {
        h.handleUpdate(editor);
        pendingState.value = h.isPending();

        // Cancel any existing rAF to prevent multiple concurrent loops
        if (rafId !== null) cancelAnimationFrame(rafId);

        // Schedule state update after debounce
        const checkPending = () => {
          if (h.isPending()) {
            rafId = requestAnimationFrame(checkPending);
          } else {
            rafId = null;
            markdown.value = h.getMarkdown();
            pendingState.value = false;
          }
        };
        rafId = requestAnimationFrame(checkPending);
      };

      editor.on("update", handleUpdate);

      // Cleanup when watch re-runs or component unmounts
      onCleanup(() => {
        editor.off("update", handleUpdate);
        if (rafId !== null) cancelAnimationFrame(rafId);
      });
    },
    { immediate: true }
  );

  // Cleanup on unmount
  onBeforeUnmount(() => {
    handlers?.destroy();
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
