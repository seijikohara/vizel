import type { Editor } from "@tiptap/vue-3";
import { type InjectionKey, inject } from "vue";

export const EDITOR_INJECTION_KEY: InjectionKey<() => Editor | undefined> = Symbol("vizel-editor");

/**
 * Composable to access the editor instance from EditorRoot context.
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
export function useEditorContext(): Editor | undefined {
  const getEditor = inject(EDITOR_INJECTION_KEY);
  if (!getEditor) {
    throw new Error("useEditorContext must be used within an EditorRoot");
  }
  return getEditor();
}

/**
 * Composable to access the editor instance from context.
 * Returns undefined if used outside of EditorRoot (does not throw).
 */
export function useEditorContextSafe(): Editor | undefined {
  const getEditor = inject(EDITOR_INJECTION_KEY);
  return getEditor?.();
}
