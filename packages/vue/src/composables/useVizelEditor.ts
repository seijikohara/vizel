import {
  createVizelExtensions,
  defaultEditorProps,
  Editor,
  type Extensions,
  registerUploadEventHandler,
  resolveFeatures,
  type VizelEditorOptions,
} from "@vizel/core";
import type { ShallowRef } from "vue";
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { createSlashMenuRenderer } from "./createSlashMenuRenderer.ts";

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
export function useVizelEditor(options: UseVizelEditorOptions = {}): ShallowRef<Editor | null> {
  const {
    initialContent,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    extensions: additionalExtensions = [],
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  const resolvedFeatures = resolveFeatures({
    features,
    createSlashMenuRenderer,
  });

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  const editor = shallowRef<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  let cleanupHandler: (() => void) | null = null;

  onMounted(() => {
    editor.value = new Editor({
      extensions: [
        ...createVizelExtensions({ placeholder, features: resolvedFeatures }),
        ...additionalExtensions,
      ],
      content: initialContent,
      editable,
      autofocus,
      editorProps: defaultEditorProps,
      // Only pass event handlers that are defined to avoid tiptap emit errors
      ...(onUpdate && { onUpdate }),
      ...(onCreate && { onCreate }),
      ...(onDestroy && { onDestroy }),
      ...(onSelectionUpdate && { onSelectionUpdate }),
      ...(onFocus && { onFocus }),
      ...(onBlur && { onBlur }),
    });

    cleanupHandler = registerUploadEventHandler({
      getEditor: () => editor.value,
      getImageOptions: () => imageOptions,
    });
  });

  onBeforeUnmount(() => {
    cleanupHandler?.();
    editor.value?.destroy();
  });

  return editor;
}
