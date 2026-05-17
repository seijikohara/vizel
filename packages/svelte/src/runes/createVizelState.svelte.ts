import { createVizelEditorTransactionStore, type Editor } from "@vizel/core";

/**
 * Rune that forces a re-render whenever the editor's state changes.
 *
 * Wraps `@vizel/core`'s `createVizelEditorTransactionStore` so the
 * subscribe/version-counter mechanics are shared with the React and
 * Vue adapters.
 *
 * The exposed field is named `version` (not `current`) because the value is
 * an opaque monotonic counter, not the editor itself. The Svelte editor
 * accessor (`createVizelEditor().current`) already owns the `current` slot
 * for the editor instance; this rune sits next to it as a sibling reactive
 * read, so a distinct name avoids the implication of a "current editor"
 * dual.
 *
 * @param getEditor - A function that returns the editor instance
 * @returns An object with a `version` getter for the update count
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * const state = createVizelState(() => editor);
 * // Access state.version to trigger reactivity
 * </script>
 * <button class:active={state.version >= 0 && editor.isActive('bold')}>Bold</button>
 * ```
 */
export function createVizelState(getEditor: () => Editor | null | undefined): {
  readonly version: number;
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
    get version() {
      return updateCount;
    },
  };
}
