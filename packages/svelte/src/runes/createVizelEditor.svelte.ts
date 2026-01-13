import {
  createVizelEditorInstance,
  type Editor,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
} from "@vizel/core";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.ts";

/**
 * Options for createVizelEditor rune.
 * @see VizelCreateEditorOptions for available options.
 */
export type CreateVizelEditorOptions = VizelCreateEditorOptions;

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
  const { features, extensions: additionalExtensions = [], ...editorOptions } = options;

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  let editor = $state<Editor | null>(null);

  // Create editor on mount and cleanup on destroy
  $effect(() => {
    const { editor: instance } = createVizelEditorInstance({
      ...editorOptions,
      ...(features !== undefined && { features }),
      extensions: additionalExtensions,
      createSlashMenuRenderer: createVizelSlashMenuRenderer,
    });

    editor = instance;

    // Handle vizel:upload-image custom event from slash command
    const cleanupHandler = registerVizelUploadEventHandler({
      getEditor: () => editor,
      getImageOptions: () => imageOptions,
    });

    return () => {
      cleanupHandler();
      editor?.destroy();
    };
  });

  return {
    get current() {
      return editor;
    },
  };
}
