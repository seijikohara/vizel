import type { Editor } from "@tiptap/core";
import { getVizelEditorState, type VizelEditorState } from "@vizel/core";
import { createVizelState } from "./createVizelState.svelte.ts";

/**
 * Rune that returns the current editor state and updates on state changes.
 * This is a convenience rune that combines `createVizelState` (for reactivity)
 * and `getVizelEditorState` (for state extraction).
 *
 * @param getEditor - A function that returns the editor instance
 * @returns An object with a `current` getter for the editor state
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * const editorState = createVizelEditorState(() => editor);
 * </script>
 *
 * <div class="status-bar">
 *   <span>{editorState.current.characterCount} characters</span>
 *   <span>{editorState.current.wordCount} words</span>
 *   <button disabled={!editorState.current.canUndo}>Undo</button>
 *   <button disabled={!editorState.current.canRedo}>Redo</button>
 * </div>
 * ```
 */
export function createVizelEditorState(getEditor: () => Editor | null | undefined): {
  readonly current: VizelEditorState;
} {
  // Subscribe to editor state changes for reactivity
  const state = createVizelState(getEditor);

  return {
    get current() {
      // Access state.current to establish reactivity dependency
      void state.current;
      return getVizelEditorState(getEditor());
    },
  };
}
