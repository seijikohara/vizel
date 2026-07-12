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
/**
 * Pointer-outside and Escape dismissal route through
 * `createVizelDismissable` from `@vizel/headless`; `deferPointerHandler`
 * defers the outside-click listener install so the opening pointerdown
 * does not register as an outside click.
 * `createVizelFocusTrapController` traps Tab inside the form, focuses the
 * URL input on open, and returns focus to the bubble-menu trigger on
 * close.
 */
import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  resolveVizelLinkEditorLabels,
} from "@vizel/core";
import { createVizelDismissable, createVizelFocusTrapController } from "@vizel/headless";
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

// Mount the dismissable and focus-trap controllers once the form element
// binds. Reading `formElement` keeps the effect reactive to the bind:this
// assignment that fires only after `viewState` becomes non-null.
$effect(() => {
  if (!formElement) return;

  // `captureEscape: true` runs the Escape handler in the capture phase and
  // calls `stopImmediatePropagation()`. The link editor owns Escape while
  // open; otherwise the editor's bubble-phase keymap also fires and resets
  // the selection, closing the popover and dropping focus from the input.
  // The controller owns this adapter-side contract.
  const controller = createVizelDismissable({
    onPointerOutside: () => onclose?.(),
    onEscape: () => onclose?.(),
    captureEscape: true,
    // Defer the outside-click listener install so the pointerdown that
    // opens the link editor does not immediately register as an outside
    // click.
    deferPointerHandler: true,
  });
  controller.mount(formElement);

  // The trap focuses the URL input on open (replacing the former
  // `inputElement.focus()`), keeps Tab inside the form, and returns focus
  // to the trigger on close. It ignores Escape so the dismissable stays
  // the sole owner of the close gesture.
  const focusTrap = createVizelFocusTrapController();
  focusTrap.mount(formElement);

  return () => {
    controller.unmount();
    focusTrap.unmount();
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
  <form bind:this={formElement} class="vizel-link-editor {className ?? ''}" onsubmit={handleSubmit}>
    <div class="vizel-link-editor-row">
      <input
        bind:value={url}
        type="url"
        placeholder={labels.urlPlaceholder}
        class="vizel-link-input"
        aria-label={labels.urlAriaLabel}
      />
      <button
        type="submit"
        class="vizel-link-button"
        title={labels.apply}
        aria-label={labels.applyAriaLabel}
      >
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
        <input type="checkbox" bind:checked={openInNewTab} />
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
