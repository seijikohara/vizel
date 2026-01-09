import { Editor, type Extensions } from "@tiptap/core";
import {
  createVizelExtensions,
  initializeVizelMarkdownContent,
  registerVizelUploadEventHandler,
  resolveVizelFeatures,
  type VizelEditorOptions,
  vizelDefaultEditorProps,
} from "@vizel/core";
import type { ShallowRef } from "vue";
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.ts";

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
  const {
    initialContent,
    initialMarkdown,
    transformDiagramsOnImport = true,
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

  const resolvedFeatures = resolveVizelFeatures({
    ...(features !== undefined && { features }),
    createSlashMenuRenderer: createVizelSlashMenuRenderer,
  });

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  const editor = shallowRef<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  let cleanupHandler: (() => void) | null = null;

  onMounted(() => {
    // Wrap onCreate to handle initialMarkdown
    const wrappedOnCreate = initialMarkdown
      ? (props: { editor: Editor }) => {
          initializeVizelMarkdownContent(props.editor, initialMarkdown, {
            transformDiagrams: transformDiagramsOnImport,
          });
          onCreate?.(props);
        }
      : onCreate;

    editor.value = new Editor({
      extensions: [
        ...createVizelExtensions({
          ...(placeholder !== undefined && { placeholder }),
          ...(resolvedFeatures !== undefined && { features: resolvedFeatures }),
        }),
        ...additionalExtensions,
      ],
      // Only set initialContent if initialMarkdown is not provided
      ...(!initialMarkdown && initialContent !== undefined && { content: initialContent }),
      editable,
      autofocus,
      editorProps: vizelDefaultEditorProps,
      // Only pass event handlers that are defined to avoid tiptap emit errors
      ...(onUpdate && { onUpdate }),
      ...(wrappedOnCreate && { onCreate: wrappedOnCreate }),
      ...(onDestroy && { onDestroy }),
      ...(onSelectionUpdate && { onSelectionUpdate }),
      ...(onFocus && { onFocus }),
      ...(onBlur && { onBlur }),
    });

    cleanupHandler = registerVizelUploadEventHandler({
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
