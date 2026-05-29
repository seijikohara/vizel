<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

export interface VizelFindReplaceProps {
  /**
   * The Tiptap editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding `<VizelProvider>` / `<Vizel>` context.
   */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
  /** Callback when the panel is closed */
  onclose?: () => void;
}
</script>

<script lang="ts">
import {
  buildVizelFindReplaceSpec,
  getVizelFindReplaceState,
  resolveVizelFindReplaceLabels,
  type VizelFindReplaceState,
} from "@vizel/core";
import { createVizelFocusTrapController } from "@vizel/headless";
import { tick } from "svelte";
import { getVizelContextSafe } from "./VizelContext.js";

let { editor: editorProp, class: className, locale, onclose }: VizelFindReplaceProps = $props();
const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.current ?? null);
const labels = $derived(resolveVizelFindReplaceLabels(locale?.findReplace));

// Empty state for initial value
const emptyState: VizelFindReplaceState = {
  query: "",
  matches: [],
  activeIndex: -1,
  caseSensitive: false,
  isOpen: false,
  mode: "find",
};

let findText = $state("");
let replaceText = $state("");
let caseSensitive = $state(false);
let findReplaceState = $state(emptyState);
let panelElement: HTMLDivElement | null = $state(null);

const view = $derived(buildVizelFindReplaceSpec(findReplaceState, labels.noResults));
const isOpen = $derived(view.isOpen);

function updateFindReplaceState() {
  if (editor) {
    findReplaceState = getVizelFindReplaceState(editor.state) ?? emptyState;
  }
}

// Subscribe to editor transactions
$effect(() => {
  if (editor) {
    updateFindReplaceState();
    editor.on("transaction", updateFindReplaceState);
    return () => {
      editor.off("transaction", updateFindReplaceState);
    };
  }
  return undefined;
});

// Trap focus inside the panel while it is open. The trap focuses the find
// input on open (replacing the former `findInputRef.focus()`) and wraps
// Tab within the panel. It returns no focus on close because `handleClose`
// focuses `editor.view.dom` itself (ADR-0007).
$effect(() => {
  if (isOpen && panelElement) {
    const focusTrap = createVizelFocusTrapController({ returnFocusOnUnmount: false });
    const element = panelElement;
    void tick().then(() => focusTrap.mount(element));
    return () => focusTrap.unmount();
  }
  return undefined;
});

function handleFindInputChange(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  findText = value;
  editor?.commands.find(value);
}

function handleFindNext() {
  editor?.commands.findNext();
}

function handleFindPrevious() {
  editor?.commands.findPrevious();
}

function handleReplace() {
  if (editor) {
    editor.commands.replace(replaceText);
    editor.commands.findNext();
  }
}

function handleReplaceAll() {
  editor?.commands.replaceAll(replaceText);
}

function handleClose() {
  if (editor) {
    editor.commands.clearFind();
    editor.commands.closeFindReplace();
  }
  findText = "";
  replaceText = "";
  editor?.view.dom.focus();
  onclose?.();
}

function handleCaseSensitiveChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  caseSensitive = checked;
  editor?.commands.setFindCaseSensitive(checked);
  if (findText) {
    editor?.commands.find(findText);
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (e.shiftKey) {
      handleFindPrevious();
    } else {
      handleFindNext();
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    handleClose();
  }
}
</script>

{#if isOpen}
  <div
    bind:this={panelElement}
    class={`vizel-find-replace-panel ${className || ""}`}
    role="dialog"
    aria-label={labels.label}
  >
    <div class="vizel-find-replace-row">
      <input
        type="text"
        class="vizel-find-replace-input"
        placeholder={labels.findPlaceholder}
        value={findText}
        oninput={handleFindInputChange}
        onkeydown={handleKeyDown}
        aria-label={labels.findTextAriaLabel}
      />
      <span class="vizel-find-replace-count" aria-live="polite">
        {view.matchCountDisplay}
      </span>
      <button
        type="button"
        class="vizel-find-replace-button"
        disabled={view.isDisabled}
        aria-label={labels.findPreviousAriaLabel}
        title={labels.findPreviousTitle}
        onclick={handleFindPrevious}
      >
        ↑
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        disabled={view.isDisabled}
        aria-label={labels.findNextAriaLabel}
        title={labels.findNextTitle}
        onclick={handleFindNext}
      >
        ↓
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        aria-label={labels.closeAriaLabel}
        title={labels.closeTitle}
        onclick={handleClose}
      >
        ✕
      </button>
    </div>

    {#if view.isReplaceMode}
      <div class="vizel-find-replace-row">
        <input
          type="text"
          class="vizel-find-replace-input"
          placeholder={labels.replacePlaceholder}
          bind:value={replaceText}
          onkeydown={handleKeyDown}
          aria-label={labels.replaceTextAriaLabel}
        />
        <button
          type="button"
          class="vizel-find-replace-button"
          disabled={view.isDisabled}
          aria-label={labels.replaceAriaLabel}
          title={labels.replaceTitle}
          onclick={handleReplace}
        >
          {labels.replaceAriaLabel}
        </button>
        <button
          type="button"
          class="vizel-find-replace-button vizel-find-replace-button--primary"
          disabled={view.isDisabled}
          aria-label={labels.replaceAllAriaLabel}
          title={labels.replaceAllTitle}
          onclick={handleReplaceAll}
        >
          {labels.replaceAllAriaLabel}
        </button>
      </div>
    {/if}

    <div class="vizel-find-replace-options">
      <label class="vizel-find-replace-checkbox">
        <input
          type="checkbox"
          checked={caseSensitive}
          onchange={handleCaseSensitiveChange}
        />
        {labels.caseSensitive}
      </label>
    </div>
  </div>
{/if}
