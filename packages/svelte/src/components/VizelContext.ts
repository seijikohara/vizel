import type { Editor } from "@tiptap/core";
import { getContext } from "svelte";

export const VIZEL_CONTEXT_KEY = Symbol("vizel-editor");

/**
 * Get the editor instance from VizelProvider context.
 *
 * @throws Error if used outside of VizelProvider
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { getVizelContext } from '@vizel/svelte';
 *
 * const getEditor = getVizelContext();
 * </script>
 *
 * <button onclick={() => getEditor()?.chain().focus().toggleBold().run()}>
 *   Bold
 * </button>
 * ```
 */
export function getVizelContext(): () => Editor | null {
  const getEditor = getContext<(() => Editor | null) | undefined>(VIZEL_CONTEXT_KEY);
  if (!getEditor) {
    throw new Error("getVizelContext must be used within a VizelProvider");
  }
  return getEditor;
}

/**
 * Get the editor instance from context.
 * Returns undefined if used outside of VizelProvider (does not throw).
 */
export function getVizelContextSafe(): (() => Editor | null) | undefined {
  return getContext<(() => Editor | null) | undefined>(VIZEL_CONTEXT_KEY);
}
