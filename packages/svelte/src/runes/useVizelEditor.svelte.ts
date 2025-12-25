import { Editor } from "@tiptap/core";
import type { VizelEditorOptions } from "@vizel/core";
import {
  createVizelExtensions,
  defaultEditorProps,
  type Extensions,
  registerUploadEventHandler,
  resolveFeatures,
} from "@vizel/core";
import { onDestroy, onMount } from "svelte";
import { createSlashMenuRenderer } from "./createSlashMenuRenderer.ts";

export interface UseVizelEditorOptions extends VizelEditorOptions {
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
 * import { useVizelEditor, EditorContent, BubbleMenu } from '@vizel/svelte';
 *
 * const editor = useVizelEditor({
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
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}) {
  const {
    initialContent,
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

  const resolvedFeatures = resolveFeatures({
    features,
    createSlashMenuRenderer,
  });

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  let editor = $state<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  let cleanupHandler: (() => void) | null = null;

  // Create editor on mount (after DOM is ready)
  onMount(() => {
    editor = new Editor({
      extensions: [
        ...createVizelExtensions({ placeholder, features: resolvedFeatures }),
        ...additionalExtensions,
      ],
      content: initialContent,
      editable,
      autofocus,
      // Add vizel-editor class for styling
      editorProps: defaultEditorProps,
      // Only pass event handlers that are defined to avoid tiptap emit errors
      ...(onUpdate && { onUpdate }),
      ...(onCreate && { onCreate }),
      ...(onEditorDestroy && { onDestroy: onEditorDestroy }),
      ...(onSelectionUpdate && { onSelectionUpdate }),
      ...(onFocus && { onFocus }),
      ...(onBlur && { onBlur }),
    });

    cleanupHandler = registerUploadEventHandler({
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
