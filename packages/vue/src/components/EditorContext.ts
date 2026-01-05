import type { Editor } from "@vizel/core";
import { type ComputedRef, computed, type InjectionKey, inject } from "vue";

export const EDITOR_CONTEXT_KEY: InjectionKey<() => Editor | null> = Symbol("vizel-editor");

/**
 * Composable to access the editor instance from EditorRoot context.
 * Returns a computed ref that reactively updates when the editor changes.
 *
 * @throws Error if used outside of EditorRoot
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useEditorContext } from '@vizel/vue';
 *
 * const editor = useEditorContext();
 * </script>
 *
 * <template>
 *   <button @click="editor?.chain().focus().toggleBold().run()">
 *     Bold
 *   </button>
 * </template>
 * ```
 */
export function useEditorContext(): ComputedRef<Editor | null> {
  const getEditor = inject(EDITOR_CONTEXT_KEY);
  if (!getEditor) {
    throw new Error("useEditorContext must be used within an EditorRoot");
  }
  return computed(() => getEditor());
}

/**
 * Composable to access the editor getter from context.
 * Returns null if used outside of EditorRoot (does not throw).
 *
 * @returns A getter function that returns the editor, or null if outside EditorRoot
 */
export function useEditorContextSafe(): (() => Editor | null) | null {
  // Provide null as default to suppress Vue warning when used outside EditorRoot
  return inject(EDITOR_CONTEXT_KEY, null);
}
