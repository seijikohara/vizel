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
 * import { useEditorContext } from '@vizel/svelte';
 *
 * const getEditor = useEditorContext();
 * </script>
 *
 * <button onclick={() => getEditor()?.chain().focus().toggleBold().run()}>
 *   Bold
 * </button>
 * ```
 */
export function useEditorContext(): () => Editor | null {
  const getEditor = getContext<(() => Editor | null) | undefined>(EDITOR_CONTEXT_KEY);
  if (!getEditor) {
    throw new Error("useEditorContext must be used within an EditorRoot");
  }
  return getEditor;
}

/**
 * Get the editor instance from context.
 * Returns undefined if used outside of EditorRoot (does not throw).
 */
export function useEditorContextSafe(): (() => Editor | null) | undefined {
  return getContext<(() => Editor | null) | undefined>(EDITOR_CONTEXT_KEY);
}
