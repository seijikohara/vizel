<script lang="ts">
import type { Editor } from "@vizel/core";

interface Props {
  editor: Editor | null;
  class?: string;
}

let { editor, class: className }: Props = $props();
let element: HTMLElement | undefined = $state();

$effect(() => {
  if (editor && element) {
    // Mount the editor's DOM view to the container element
    element.appendChild(editor.view.dom);

    // Update editable state
    editor.view.setProps({
      editable: () => editor?.isEditable ?? false,
    });
  }
});
</script>

<div bind:this={element} class={className} data-vizel-content></div>
