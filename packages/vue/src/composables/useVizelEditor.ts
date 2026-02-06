import {
  createVizelEditorInstance,
  type Editor,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
  wrapAsVizelError,
} from "@vizel/core";
import type { ShallowRef } from "vue";
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.ts";

/**
 * Options for useVizelEditor composable.
 * @see VizelCreateEditorOptions for available options.
 */
export type UseVizelEditorOptions = VizelCreateEditorOptions;

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
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * // With initial markdown content
 * const editor = useVizelEditor({
 *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
 * });
 * </script>
 * ```
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}): ShallowRef<Editor | null> {
  const { features, extensions: additionalExtensions = [], ...editorOptions } = options;

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  const editor = shallowRef<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  let cleanupHandler: (() => void) | null = null;

  onMounted(async () => {
    try {
      const result = await createVizelEditorInstance({
        ...editorOptions,
        ...(features !== undefined && { features }),
        extensions: additionalExtensions,
        createSlashMenuRenderer: createVizelSlashMenuRenderer,
      });

      editor.value = result.editor;

      cleanupHandler = registerVizelUploadEventHandler({
        getEditor: () => editor.value,
        getImageOptions: () => imageOptions,
      });
    } catch (error) {
      const vizelError = wrapAsVizelError(error, {
        context: "Editor initialization failed",
        code: "EDITOR_INIT_FAILED",
      });
      editorOptions.onError?.(vizelError);
      throw vizelError;
    }
  });

  onBeforeUnmount(() => {
    cleanupHandler?.();
    editor.value?.destroy();
  });

  return editor;
}
