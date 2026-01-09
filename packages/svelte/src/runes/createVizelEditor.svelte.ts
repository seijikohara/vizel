import { Editor, type Extensions } from "@tiptap/core";
import type { VizelEditorOptions } from "@vizel/core";
import {
  createVizelExtensions,
  initializeVizelMarkdownContent,
  registerVizelUploadEventHandler,
  resolveVizelFeatures,
  vizelDefaultEditorProps,
} from "@vizel/core";
import { onDestroy, onMount } from "svelte";
import { createVizelSlashMenuRenderer } from "./createSlashMenuRenderer.ts";

export interface CreateVizelEditorOptions extends VizelEditorOptions {
  /** Additional extensions to include */
  extensions?: Extensions;
}

/**
 * Svelte 5 rune to create and manage a Vizel editor instance.
 * Returns a reactive editor state that works with EditorContent component.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, EditorContent, BubbleMenu } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getJSON());
 *   },
 * });
 * </script>
 *
 * <EditorContent editor={editor.current} />
 * {#if editor.current}
 *   <BubbleMenu editor={editor.current} />
 * {/if}
 * ```
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * // With initial markdown content
 * const editor = createVizelEditor({
 *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
 * });
 * </script>
 * ```
 */
export function createVizelEditor(options: CreateVizelEditorOptions = {}) {
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
    onDestroy: onEditorDestroy,
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

  let editor = $state<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  let cleanupHandler: (() => void) | null = null;

  // Create editor on mount (after DOM is ready)
  onMount(() => {
    // Wrap onCreate to handle initialMarkdown
    const wrappedOnCreate = initialMarkdown
      ? (props: { editor: Editor }) => {
          initializeVizelMarkdownContent(props.editor, initialMarkdown, {
            transformDiagrams: transformDiagramsOnImport,
          });
          onCreate?.(props);
        }
      : onCreate;

    editor = new Editor({
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
      // Add vizel-editor class for styling
      editorProps: vizelDefaultEditorProps,
      // Only pass event handlers that are defined to avoid tiptap emit errors
      ...(onUpdate && { onUpdate }),
      ...(wrappedOnCreate && { onCreate: wrappedOnCreate }),
      ...(onEditorDestroy && { onDestroy: onEditorDestroy }),
      ...(onSelectionUpdate && { onSelectionUpdate }),
      ...(onFocus && { onFocus }),
      ...(onBlur && { onBlur }),
    });

    cleanupHandler = registerVizelUploadEventHandler({
      getEditor: () => editor,
      getImageOptions: () => imageOptions,
    });
  });

  // Cleanup on component destroy
  onDestroy(() => {
    cleanupHandler?.();
    editor?.destroy();
  });

  return {
    get current() {
      return editor;
    },
  };
}
