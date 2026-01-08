<script lang="ts" module>
import type { Editor } from "@tiptap/core";

export interface EditorContentProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { getVizelContextSafe } from "./VizelContext.ts";

let { editor: editorProp, class: className }: EditorContentProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.());

let element: HTMLElement | undefined = $state();

$effect(() => {
  if (!editor || !element) {
    return;
  }

  const currentEditor = editor;
  const currentElement = element;

  // Mount the editor's DOM view to the container element
  currentElement.appendChild(currentEditor.view.dom);

  // Update editable state
  currentEditor.view.setProps({
    editable: () => currentEditor?.isEditable ?? false,
  });

  // Cleanup: remove DOM element when editor changes or unmounts
  return () => {
    if (currentEditor.view.dom.parentNode === currentElement) {
      currentElement.removeChild(currentEditor.view.dom);
    }
  };
});
</script>

<div bind:this={element} class={className} data-vizel-content></div>
