<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface BubbleMenuLinkEditorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Close handler */
  onclose?: () => void;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
}
</script>

<script lang="ts">
import { detectProvider } from "@vizel/core";
import { onMount, untrack } from "svelte";

let {
  editor,
  class: className,
  onclose,
  enableEmbed = false,
}: BubbleMenuLinkEditorProps = $props();

let formElement: HTMLFormElement;
let inputElement: HTMLInputElement;
let currentHref = $derived(editor.getAttributes("link").href || "");
let url = $state(untrack(() => editor.getAttributes("link").href || ""));
let asEmbed = $state(false);

// Check if embed extension is available
const canEmbed = $derived.by(() => {
  if (!enableEmbed) return false;
  // Check if embed extension is loaded
  const extensionManager = editor.extensionManager;
  return extensionManager.extensions.some((ext) => ext.name === "embed");
});

// Check if URL is a known embed provider
const isEmbedProvider = $derived(() => {
  if (!url.trim()) return false;
  return detectProvider(url.trim()) !== null;
});

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
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    editor.chain().focus().unsetLink().run();
    onclose?.();
    return;
  }

  if (asEmbed && canEmbed) {
    // Remove the link first, then insert embed
    editor.chain().focus().unsetLink().setEmbed({ url: trimmedUrl }).run();
  } else {
    editor.chain().focus().setLink({ href: trimmedUrl }).run();
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
  <div class="vizel-link-editor-row">
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
  </div>
  {#if canEmbed && isEmbedProvider()}
    <div class="vizel-link-editor-embed-toggle">
      <input
        id="vizel-embed-toggle"
        type="checkbox"
        bind:checked={asEmbed}
      />
      <label for="vizel-embed-toggle">Embed as rich content</label>
    </div>
  {/if}
</form>
