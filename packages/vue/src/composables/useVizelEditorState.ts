import type { Editor } from "@tiptap/core";
import { getVizelEditorState, type VizelEditorState } from "@vizel/core";
import { type ComputedRef, computed } from "vue";
import { useVizelState } from "./useVizelState.ts";

/**
 * Composable that returns the current editor state and re-renders on state changes.
 * This is a convenience composable that combines `useVizelState` (for reactivity)
 * and `getVizelEditorState` (for state extraction).
 *
 * @param getEditor - A function that returns the editor instance
 * @returns A computed ref containing the current editor state
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const props = defineProps<{ editor: Editor | null }>();
 * const editorState = useVizelEditorState(() => props.editor);
 * </script>
 *
 * <template>
 *   <div class="status-bar">
 *     <span>{{ editorState.characterCount }} characters</span>
 *     <span>{{ editorState.wordCount }} words</span>
 *     <button :disabled="!editorState.canUndo">Undo</button>
 *     <button :disabled="!editorState.canRedo">Redo</button>
 *   </div>
 * </template>
 * ```
 */
export function useVizelEditorState(
  getEditor: () => Editor | null | undefined
): ComputedRef<VizelEditorState> {
  // Subscribe to editor state changes for reactivity
  const updateCount = useVizelState(getEditor);

  // Return a computed ref that recalculates on state changes
  return computed(() => {
    // Access updateCount.value to establish reactivity dependency
    void updateCount.value;
    return getVizelEditorState(getEditor());
  });
}
