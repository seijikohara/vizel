<script lang="ts">
import type { Editor } from "@vizel/core";
import { onDestroy, onMount } from "svelte";

interface Props {
  editor: Editor | null;
  class?: string;
}

let { editor, class: className }: Props = $props();
let element: HTMLElement;

$effect(() => {
  if (editor && element) {
    editor.setOptions({ element });
  }
});
</script>

<div bind:this={element} class={className} data-vizel-content></div>
