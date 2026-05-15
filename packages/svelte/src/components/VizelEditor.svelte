<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface VizelExposed {
  /** The container DOM element */
  container: HTMLDivElement | null;
}

export interface VizelEditorProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /**
   * Mutable ref object the component keeps in sync with the editor container.
   * Pass an object; this component assigns `container` so callers can read
   * `ref.container` directly — symmetric with React's `useImperativeHandle`
   * and Vue's `defineExpose`.
   */
  ref?: VizelExposed;
}
</script>

<script lang="ts">
import { mountVizelEditorView } from "@vizel/core";
import { getVizelContextSafe } from "./VizelContext.js";

let { editor: editorProp, class: className, ref }: VizelEditorProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.current);

let element: HTMLDivElement | null = $state(null);

// Keep ref.container in sync with the bound element.
$effect(() => {
  if (ref) {
    ref.container = element;
  }
});

$effect(() => {
  if (!editor || !element) return;
  return mountVizelEditorView(editor, element);
});
</script>

{#if editor}
  <div bind:this={element} class={className} data-vizel-content></div>
{/if}
