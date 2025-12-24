<script lang="ts">
import type { Editor } from "@vizel/core";
import { onMount } from "svelte";

interface Props {
  editor: Editor;
  class?: string;
  onclose?: () => void;
}

let { editor, class: className, onclose }: Props = $props();

let inputElement: HTMLInputElement;
let currentHref = $derived(editor.getAttributes("link").href || "");
let url = $state(editor.getAttributes("link").href || "");

onMount(() => {
  inputElement?.focus();
});

function handleSubmit(e: Event) {
  e.preventDefault();
  if (url.trim()) {
    editor.chain().focus().setLink({ href: url.trim() }).run();
  } else {
    editor.chain().focus().unsetLink().run();
  }
  onclose?.();
}

function handleRemove() {
  editor.chain().focus().unsetLink().run();
  onclose?.();
}
</script>

<form class="vizel-link-editor {className ?? ''}" onsubmit={handleSubmit}>
  <input
    bind:this={inputElement}
    bind:value={url}
    type="url"
    placeholder="Enter URL..."
    class="vizel-link-input"
  />
  <button type="submit" class="vizel-link-button" title="Apply">
    OK
  </button>
  {#if currentHref}
    <button
      type="button"
      class="vizel-link-button vizel-link-remove"
      title="Remove link"
      onclick={handleRemove}
    >
      X
    </button>
  {/if}
</form>
