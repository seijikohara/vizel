import { createVizelEditorTransactionStore, type Editor } from "@vizel/core";
import { onBeforeUnmount, type Ref, ref, watch } from "vue";

/**
 * Composable that forces a re-render whenever the editor's state changes.
 *
 * Wraps `@vizel/core`'s `createVizelEditorTransactionStore` so the
 * subscribe/version-counter mechanics are shared with the React and
 * Svelte adapters.
 *
 * @param getEditor - A function that returns the editor instance
 * @returns A ref that changes on each editor state update (can be ignored)
 *
 * @example
 * ```vue
 * <script setup>
 * const props = defineProps<{ editor: Editor }>();
 * useVizelState(() => props.editor);
 * </script>
 * <template>
 *   <button :class="{ active: props.editor.isActive('bold') }">Bold</button>
 * </template>
 * ```
 */
export function useVizelState(getEditor: () => Editor | null | undefined): Ref<number> {
  const updateCount = ref(0);
  let unsubscribe: (() => void) | null = null;

  watch(
    getEditor,
    (editor) => {
      unsubscribe?.();
      if (!editor) {
        unsubscribe = null;
        return;
      }
      const store = createVizelEditorTransactionStore(() => editor);
      unsubscribe = store.subscribe(() => {
        updateCount.value = store.getVersion();
      });
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return updateCount;
}
