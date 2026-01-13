<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface VizelEditorProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
}

export interface VizelExposed {
  /** The container DOM element */
  container: HTMLDivElement | null;
}
</script>

<script lang="ts">
import { getVizelContextSafe } from "./VizelContext.ts";

let { editor: editorProp, class: className }: VizelEditorProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.());

let element: HTMLDivElement | null = $state(null);

// Expose container element to parent component
export function getExposed(): VizelExposed {
  return {
    get container() {
      return element;
    },
  };
}

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
