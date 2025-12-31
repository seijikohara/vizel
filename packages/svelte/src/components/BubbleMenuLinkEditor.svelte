<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface BubbleMenuLinkEditorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Close handler */
  onclose?: () => void;
}
</script>

<script lang="ts">
import { onMount, untrack } from "svelte";

let { editor, class: className, onclose }: BubbleMenuLinkEditorProps = $props();

let formElement: HTMLFormElement;
let inputElement: HTMLInputElement;
let currentHref = $derived(editor.getAttributes("link").href || "");
let url = $state(untrack(() => editor.getAttributes("link").href || ""));

// Handle click outside to close
function handleClickOutside(event: MouseEvent) {
  if (formElement && !formElement.contains(event.target as Node)) {
    onclose?.();
  }
}

// Handle Escape key to close
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    onclose?.();
  }
}

onMount(() => {
  inputElement?.focus();

  // Use setTimeout to avoid immediate trigger from the click that opened the editor
  const timeoutId = setTimeout(() => {
    document.addEventListener("mousedown", handleClickOutside);
  }, 0);
  // Use capture phase so this handler runs before BubbleMenu's handler
  document.addEventListener("keydown", handleKeyDown, true);

  return () => {
    clearTimeout(timeoutId);
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown, true);
  };
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

<form
  bind:this={formElement}
  class="vizel-link-editor {className ?? ''}"
  onsubmit={handleSubmit}
>
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
