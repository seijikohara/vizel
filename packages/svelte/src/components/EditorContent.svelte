<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface EditorContentProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { useEditorContextSafe } from "./EditorContext.ts";

let { editor: editorProp, class: className }: EditorContentProps = $props();

const contextEditor = useEditorContextSafe();
const editor = $derived(editorProp ?? contextEditor?.());

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
