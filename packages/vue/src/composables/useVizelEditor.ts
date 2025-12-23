import { useEditor, type Editor } from "@tiptap/vue-3";
import { createVizelExtensions, type Extensions } from "@vizel/core";
import type { VizelEditorOptions } from "@vizel/core";
import type { ShallowRef } from "vue";

export interface UseVizelEditorOptions extends VizelEditorOptions {
  /** Additional extensions to include */
  extensions?: Extensions;
}

/**
 * Vue composable to create and manage a Vizel editor instance.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, EditorContent } from '@vizel/vue';
 *
 * const editor = useVizelEditor({
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getJSON());
 *   },
 * });
 * </script>
 *
 * <template>
 *   <EditorContent :editor="editor" />
 * </template>
 * ```
 */
export function useVizelEditor(
  options: UseVizelEditorOptions = {}
): ShallowRef<Editor | undefined> {
  const {
    initialContent,
    placeholder,
    editable = true,
    autofocus = false,
    extensions: additionalExtensions = [],
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  return useEditor({
    extensions: [
      ...createVizelExtensions({ placeholder }),
      ...additionalExtensions,
    ],
    content: initialContent,
    editable,
    autofocus,
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  });
}
