<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { Editor } from "@vizel/core";

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
