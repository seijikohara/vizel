<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

export interface VizelLinkEditorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom class name */
  class?: string;
  /** Close handler */
  onclose?: () => void;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  applyVizelLinkEdit,
  buildVizelLinkEditorViewState,
  resolveVizelLinkEditorLabels,
} from "@vizel/core";
import { untrack } from "svelte";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor,
  class: className,
  onclose,
  enableEmbed = false,
  locale,
}: VizelLinkEditorProps = $props();

let formElement: HTMLFormElement;
let inputElement: HTMLInputElement;

const labels = $derived(resolveVizelLinkEditorLabels(locale));
let url = $state(untrack(() => buildVizelLinkEditorViewState(editor, "", enableEmbed).initialUrl));
let openInNewTab = $state(
  untrack(() => buildVizelLinkEditorViewState(editor, "", enableEmbed).initialOpenInNewTab)
);
let asEmbed = $state(false);

const viewState = $derived(buildVizelLinkEditorViewState(editor, url, enableEmbed));

function handleClickOutside(event: MouseEvent) {
  if (!(event.target instanceof Node)) return;
  if (formElement && !formElement.contains(event.target)) {
    onclose?.();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    onclose?.();
  }
}

$effect(() => {
  inputElement?.focus();

  const timeoutId = setTimeout(() => {
    document.addEventListener("mousedown", handleClickOutside);
  }, 0);
  document.addEventListener("keydown", handleKeyDown, true);

  return () => {
    clearTimeout(timeoutId);
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown, true);
  };
});

function handleSubmit(e: Event) {
  e.preventDefault();
  applyVizelLinkEdit(editor, { url, openInNewTab, asEmbed }, viewState.canEmbed);
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
      placeholder={labels.urlPlaceholder}
      class="vizel-link-input"
      aria-label={labels.urlAriaLabel}
    />
    <button type="submit" class="vizel-link-button" title={labels.apply} aria-label={labels.applyAriaLabel}>
      <VizelIcon name="check" />
    </button>
    {#if viewState.showRemoveButton}
      <button
        type="button"
        class="vizel-link-button vizel-link-remove"
        title={labels.removeLink}
        aria-label={labels.removeLinkAriaLabel}
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
      <span>{labels.openInNewTab}</span>
    </label>
    {#if viewState.showVisitButton}
      <button
        type="button"
        class="vizel-link-visit"
        title={labels.visitTitle}
        onclick={handleVisit}
      >
        <VizelIcon name="externalLink" />
        <span>{labels.visit}</span>
      </button>
    {/if}
  </div>
  {#if viewState.showEmbedToggle}
    <div class="vizel-link-editor-embed-toggle">
      <input
        id="vizel-embed-toggle"
        type="checkbox"
        bind:checked={asEmbed}
      />
      <label for="vizel-embed-toggle">{labels.embedAsRichContent}</label>
    </div>
  {/if}
</form>
