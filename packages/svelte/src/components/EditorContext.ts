import type { Editor } from "@vizel/core";
import { getContext } from "svelte";

export const EDITOR_CONTEXT_KEY = Symbol("vizel-editor");

/**
 * Get the editor instance from EditorRoot context.
 *
 * @throws Error if used outside of EditorRoot
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { getEditorContext } from '@vizel/svelte';
 *
 * const getEditor = getEditorContext();
 * </script>
 *
 * <button onclick={() => getEditor()?.chain().focus().toggleBold().run()}>
 *   Bold
 * </button>
 * ```
 */
export function getEditorContext(): () => Editor | null {
  const getEditor = getContext<(() => Editor | null) | undefined>(EDITOR_CONTEXT_KEY);
  if (!getEditor) {
    throw new Error("getEditorContext must be used within an EditorRoot");
  }
  return getEditor;
}

/**
 * Get the editor instance from context.
 * Returns undefined if used outside of EditorRoot (does not throw).
 */
export function getEditorContextSafe(): (() => Editor | null) | undefined {
  return getContext<(() => Editor | null) | undefined>(EDITOR_CONTEXT_KEY);
}
