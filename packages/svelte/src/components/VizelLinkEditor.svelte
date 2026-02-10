<script lang="ts" module>
import type { Editor } from "@vizel/core";

export interface VizelLinkEditorProps {
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
import { detectVizelEmbedProvider } from "@vizel/core";
import { untrack } from "svelte";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor,
  class: className,
  onclose,
  enableEmbed = false,
}: VizelLinkEditorProps = $props();

let formElement: HTMLFormElement;
let inputElement: HTMLInputElement;
let linkAttrs = $derived(editor.getAttributes("link"));
let currentHref = $derived(linkAttrs.href || "");
let url = $state(untrack(() => editor.getAttributes("link").href || ""));
let openInNewTab = $state(untrack(() => editor.getAttributes("link").target === "_blank"));
let asEmbed = $state(false);

// Check if embed extension is available
const canEmbed = $derived.by(() => {
  if (!enableEmbed) return false;
  // Check if embed extension is loaded
  const extensionManager = editor.extensionManager;
  return extensionManager.extensions.some((ext) => ext.name === "embed");
});

// Check if URL is a known embed provider
const isEmbedProvider = $derived.by(() => {
  if (!url.trim()) return false;
  return detectVizelEmbedProvider(url.trim()) !== null;
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

$effect(() => {
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
    editor
      .chain()
      .focus()
      .setLink({
        href: trimmedUrl,
        target: openInNewTab ? "_blank" : null,
      })
      .run();
  }
  onclose?.();
}

function handleRemove() {
  editor.chain().focus().unsetLink().run();
  onclose?.();
}

function handleVisit() {
  const trimmedUrl = url.trim();
  if (trimmedUrl) {
    window.open(trimmedUrl, "_blank", "noopener,noreferrer");
  }
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
      aria-label="Link URL"
    />
    <button type="submit" class="vizel-link-button" title="Apply" aria-label="Apply link">
      <VizelIcon name="check" />
    </button>
    {#if currentHref}
      <button
        type="button"
        class="vizel-link-button vizel-link-remove"
        title="Remove link"
        aria-label="Remove link"
        onclick={handleRemove}
      >
        <VizelIcon name="x" />
      </button>
    {/if}
  </div>
  <div class="vizel-link-editor-options">
    <label class="vizel-link-newtab-toggle">
      <input
        type="checkbox"
        bind:checked={openInNewTab}
      />
      <span>Open in new tab</span>
    </label>
    {#if url.trim()}
      <button
        type="button"
        class="vizel-link-visit"
        title="Open URL in new tab"
        onclick={handleVisit}
      >
        <VizelIcon name="externalLink" />
        <span>Visit</span>
      </button>
    {/if}
  </div>
  {#if canEmbed && isEmbedProvider}
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
