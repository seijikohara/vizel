<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

export interface VizelLinkEditorProps {
  /**
   * The editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding `<VizelProvider>` / `<Vizel>` context.
   */
  editor?: Editor | null;
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
  buildVizelLinkEditorSpec,
  resolveVizelLinkEditorLabels,
} from "@vizel/core";
import { untrack } from "svelte";
import { getVizelContextSafe } from "./VizelContext.js";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor: editorProp,
  class: className,
  onclose,
  enableEmbed = false,
  locale,
}: VizelLinkEditorProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.current ?? null);

let formElement = $state<HTMLFormElement | undefined>(undefined);
let inputElement = $state<HTMLInputElement | undefined>(undefined);

const labels = $derived(resolveVizelLinkEditorLabels(locale));
let url = $state(
  untrack(() => (editor ? buildVizelLinkEditorSpec(editor, "", enableEmbed).initialUrl : ""))
);
let openInNewTab = $state(
  untrack(() =>
    editor ? buildVizelLinkEditorSpec(editor, "", enableEmbed).initialOpenInNewTab : false
  )
);
let asEmbed = $state(false);

const viewState = $derived(editor ? buildVizelLinkEditorSpec(editor, url, enableEmbed) : null);

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
  if (!editor || !viewState) return;
  applyVizelLinkEdit(editor, { url, openInNewTab, asEmbed }, viewState.canEmbed);
  onclose?.();
}

function handleRemove() {
  if (!editor) return;
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

{#if viewState}
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
      <!--
        Wrap the input in the label so the click target is the same as
        a `for`/`id` pair without needing a globally-unique DOM id. Two
        link editors on one page used to share `id="vizel-embed-toggle"`,
        triggering the wrong checkbox under WCAG 4.1.1.
      -->
      <label class="vizel-link-editor-embed-toggle-label">
        <input type="checkbox" bind:checked={asEmbed} />
        <span>{labels.embedAsRichContent}</span>
      </label>
    </div>
  {/if}
</form>
{/if}
