import { createVizelEditorTransactionStore, type Editor } from "@vizel/core";

/**
 * Rune that forces a re-render whenever the editor's state changes.
 *
 * Wraps `@vizel/core`'s `createVizelEditorTransactionStore` so the
 * subscribe/version-counter mechanics are shared with the React and
 * Vue adapters.
 *
 * @param getEditor - A function that returns the editor instance
 * @returns An object with a `current` getter for the update count
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * const state = createVizelState(() => editor);
 * // Access state.current to trigger reactivity
 * </script>
 * <button class:active={state.current >= 0 && editor.isActive('bold')}>Bold</button>
 * ```
 */
export function createVizelState(getEditor: () => Editor | null | undefined): {
  readonly current: number;
} {
  let updateCount = $state(0);

  $effect(() => {
    const editor = getEditor();
    if (!editor) return;
    const store = createVizelEditorTransactionStore(() => editor);
    const unsubscribe = store.subscribe(() => {
      updateCount = store.getVersion();
    });
    return unsubscribe;
  });

  return {
    get current() {
      return updateCount;
    },
  };
}
