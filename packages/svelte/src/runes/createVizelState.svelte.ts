import type { Editor } from "@tiptap/core";

/**
 * Rune that forces a re-render whenever the editor's state changes.
 * This is useful for components that need to reflect the current editor state
 * (e.g., formatting buttons that show active state).
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
  let currentEditor: Editor | null = null;

  function handleTransaction() {
    updateCount++;
  }

  function subscribe(editor: Editor | null | undefined) {
    // Unsubscribe from previous editor
    if (currentEditor) {
      currentEditor.off("transaction", handleTransaction);
    }

    currentEditor = editor ?? null;

    // Subscribe to new editor
    if (currentEditor) {
      currentEditor.on("transaction", handleTransaction);
    }
  }

  // Use $effect to watch for editor changes - $effect cleanup handles unmount
  $effect(() => {
    const editor = getEditor();
    subscribe(editor);

    return () => {
      if (currentEditor) {
        currentEditor.off("transaction", handleTransaction);
      }
    };
  });

  return {
    get current() {
      return updateCount;
    },
  };
}
