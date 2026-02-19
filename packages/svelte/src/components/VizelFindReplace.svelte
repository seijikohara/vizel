<script lang="ts" module>
import type { Editor, VizelLocale } from "@vizel/core";

export interface VizelFindReplaceProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
  /** Callback when the panel is closed */
  onClose?: () => void;
}
</script>

<script lang="ts">
import {
  getVizelFindReplaceState,
  type VizelFindReplaceState,
} from "@vizel/core";
import { tick } from "svelte";

let { editor, class: className, locale, onClose }: VizelFindReplaceProps = $props();

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
let findInputRef: HTMLInputElement | null = $state(null);

const matchCount = $derived(findReplaceState.matches.length);
const currentMatch = $derived(
  findReplaceState.activeIndex >= 0 ? findReplaceState.activeIndex + 1 : 0,
);
const isReplaceMode = $derived(findReplaceState.mode === "replace");
const isOpen = $derived(findReplaceState.isOpen);

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

// Focus input when panel opens
$effect(() => {
  if (isOpen && findInputRef) {
    tick().then(() => {
      findInputRef?.focus();
      findInputRef?.select();
    });
  }
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
  onClose?.();
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
    class={`vizel-find-replace-panel ${className || ""}`}
    role="dialog"
    aria-label={locale?.findReplace.label ?? "Find and Replace"}
  >
    <div class="vizel-find-replace-row">
      <input
        bind:this={findInputRef}
        type="text"
        class="vizel-find-replace-input"
        placeholder={locale?.findReplace.findPlaceholder ?? "Find..."}
        value={findText}
        oninput={handleFindInputChange}
        onkeydown={handleKeyDown}
        aria-label={locale?.findReplace.findTextAriaLabel ?? "Find text"}
      />
      <span class="vizel-find-replace-count" aria-live="polite">
        {matchCount > 0 ? `${currentMatch}/${matchCount}` : (locale?.findReplace.noResults ?? "No results")}
      </span>
      <button
        type="button"
        class="vizel-find-replace-button"
        disabled={matchCount === 0}
        aria-label={locale?.findReplace.findPreviousAriaLabel ?? "Find previous"}
        title={locale?.findReplace.findPreviousTitle ?? "Find previous (Shift+Enter)"}
        onclick={handleFindPrevious}
      >
        ↑
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        disabled={matchCount === 0}
        aria-label={locale?.findReplace.findNextAriaLabel ?? "Find next"}
        title={locale?.findReplace.findNextTitle ?? "Find next (Enter)"}
        onclick={handleFindNext}
      >
        ↓
      </button>
      <button
        type="button"
        class="vizel-find-replace-button"
        aria-label={locale?.findReplace.closeAriaLabel ?? "Close"}
        title={locale?.findReplace.closeTitle ?? "Close (Escape)"}
        onclick={handleClose}
      >
        ✕
      </button>
    </div>

    {#if isReplaceMode}
      <div class="vizel-find-replace-row">
        <input
          type="text"
          class="vizel-find-replace-input"
          placeholder={locale?.findReplace.replacePlaceholder ?? "Replace with..."}
          bind:value={replaceText}
          onkeydown={handleKeyDown}
          aria-label={locale?.findReplace.replaceTextAriaLabel ?? "Replace text"}
        />
        <button
          type="button"
          class="vizel-find-replace-button"
          disabled={matchCount === 0}
          aria-label={locale?.findReplace.replaceAriaLabel ?? "Replace"}
          title={locale?.findReplace.replaceTitle ?? "Replace current match"}
          onclick={handleReplace}
        >
          {locale?.findReplace.replaceAriaLabel ?? "Replace"}
        </button>
        <button
          type="button"
          class="vizel-find-replace-button vizel-find-replace-button--primary"
          disabled={matchCount === 0}
          aria-label={locale?.findReplace.replaceAllAriaLabel ?? "Replace all"}
          title={locale?.findReplace.replaceAllTitle ?? "Replace all matches"}
          onclick={handleReplaceAll}
        >
          {locale?.findReplace.replaceAllAriaLabel ?? "All"}
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
        {locale?.findReplace.caseSensitive ?? "Case sensitive"}
      </label>
    </div>
  </div>
{/if}
