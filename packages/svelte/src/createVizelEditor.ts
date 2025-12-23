import { Editor } from "@tiptap/core";
import { createVizelExtensions, type Extensions } from "@vizel/core";
import type { VizelEditorOptions, JSONContent } from "@vizel/core";

export interface CreateVizelEditorOptions extends VizelEditorOptions {
  /** The DOM element to mount the editor to */
  element: HTMLElement;
  /** Additional extensions to include */
  extensions?: Extensions;
}

/**
 * Create a Vizel editor instance for Svelte.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { onMount, onDestroy } from 'svelte';
 * import { createVizelEditor } from '@vizel/svelte';
 *
 * let editorElement: HTMLElement;
 * let editor: Editor | null = $state(null);
 *
 * onMount(() => {
 *   editor = createVizelEditor({
 *     element: editorElement,
 *     placeholder: "Start typing...",
 *     onUpdate: ({ editor }) => {
 *       console.log(editor.getJSON());
 *     },
 *   });
 * });
 *
 * onDestroy(() => {
 *   editor?.destroy();
 * });
 * </script>
 *
 * <div bind:this={editorElement}></div>
 * ```
 */
export function createVizelEditor(options: CreateVizelEditorOptions): Editor {
  const {
    element,
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

  return new Editor({
    element,
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
