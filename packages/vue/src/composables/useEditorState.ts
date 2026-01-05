import type { Editor } from "@vizel/core";
import { onBeforeUnmount, type Ref, ref, watch } from "vue";

/**
 * Composable that forces a re-render whenever the editor's state changes.
 * This is useful for components that need to reflect the current editor state
 * (e.g., toolbar buttons that show active state).
 *
 * @param getEditor - A function that returns the editor instance
 * @returns A ref that changes on each editor state update (can be ignored)
 *
 * @example
 * ```vue
 * <script setup>
 * const props = defineProps<{ editor: Editor }>();
 * useEditorState(() => props.editor);
 * </script>
 * <template>
 *   <button :class="{ active: props.editor.isActive('bold') }">Bold</button>
 * </template>
 * ```
 */
export function useEditorState(getEditor: () => Editor | null | undefined): Ref<number> {
  const updateCount = ref(0);
  let currentEditor: Editor | null = null;

  function handleTransaction() {
    updateCount.value++;
  }

  function subscribe(editor: Editor | null | undefined) {
    // Unsubscribe from previous editor if different
    if (currentEditor && currentEditor !== editor) {
      currentEditor.off("transaction", handleTransaction);
    }

    currentEditor = editor ?? null;

    // Subscribe to new editor
    if (currentEditor) {
      currentEditor.on("transaction", handleTransaction);
    }
  }

  // Watch for editor changes and resubscribe
  watch(
    getEditor,
    (editor) => {
      subscribe(editor);
    },
    { immediate: true }
  );

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (currentEditor) {
      currentEditor.off("transaction", handleTransaction);
    }
  });

  return updateCount;
}
