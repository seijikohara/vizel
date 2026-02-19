<script lang="ts" module>
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}
</script>

<script lang="ts">
import { formatVizelTooltip } from "@vizel/core";
import VizelIcon from "./VizelIcon.svelte";

let {
  editor,
  dropdown,
  class: className,
}: VizelToolbarDropdownProps = $props();

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerEl: HTMLDivElement | undefined = $state(undefined);
let triggerEl: HTMLButtonElement | undefined = $state(undefined);

const activeOption = $derived(dropdown.getActiveOption?.(editor));
const triggerIcon = $derived(activeOption?.icon ?? dropdown.icon);
const triggerLabel = $derived(activeOption?.label ?? dropdown.label);

function close() {
  isOpen = false;
  triggerEl?.focus();
}

function toggle() {
  isOpen = !isOpen;
}

function handleOptionClick(option: VizelToolbarDropdownAction["options"][number]) {
  option.run(editor);
  close();
}

function handleTriggerKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    isOpen = true;
    focusedIndex = 0;
  }
}

function handleListKeyDown(e: KeyboardEvent) {
  const optionCount = dropdown.options.length;
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      focusedIndex = (focusedIndex + 1) % optionCount;
      break;
    case "ArrowUp":
      e.preventDefault();
      focusedIndex = (focusedIndex - 1 + optionCount) % optionCount;
      break;
    case "Home":
      e.preventDefault();
      focusedIndex = 0;
      break;
    case "End":
      e.preventDefault();
      focusedIndex = optionCount - 1;
      break;
    case "Enter":
    case " ": {
      e.preventDefault();
      const selected = dropdown.options[focusedIndex];
      if (selected?.isEnabled(editor)) {
        selected.run(editor);
        close();
      }
      break;
    }
    default:
      break;
  }
}

$effect(() => {
  if (!isOpen) return;

  focusedIndex = 0;

  function handleClick(e: MouseEvent) {
    if (!(e.target instanceof Node)) return;
    if (containerEl && !containerEl.contains(e.target)) {
      close();
    }
  }
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  document.addEventListener("mousedown", handleClick);
  document.addEventListener("keydown", handleKey);
  return () => {
    document.removeEventListener("mousedown", handleClick);
    document.removeEventListener("keydown", handleKey);
  };
});
</script>

<div
  bind:this={containerEl}
  class="vizel-toolbar-dropdown {className ?? ''}"
  data-vizel-toolbar-dropdown
>
  <button
    bind:this={triggerEl}
    type="button"
    class="vizel-toolbar-dropdown-trigger"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    title={triggerLabel}
    onclick={toggle}
    onkeydown={handleTriggerKeyDown}
  >
    <VizelIcon name={triggerIcon} />
    <span class="vizel-toolbar-dropdown-chevron">
      <VizelIcon name="chevronDown" />
    </span>
  </button>

  {#if isOpen}
    <div
      class="vizel-toolbar-dropdown-popover"
      role="listbox"
      aria-label={dropdown.label}
      aria-activedescendant={`vizel-dropdown-${dropdown.id}-${dropdown.options[focusedIndex]?.id}`}
      tabindex="0"
      onkeydown={handleListKeyDown}
    >
      {#each dropdown.options as option, index (option.id)}
        <button
          id={`vizel-dropdown-${dropdown.id}-${option.id}`}
          type="button"
          role="option"
          aria-selected={option.isActive(editor)}
          class="vizel-toolbar-dropdown-option {option.isActive(editor) ? 'is-active' : ''} {index === focusedIndex ? 'is-focused' : ''}"
          disabled={!option.isEnabled(editor)}
          title={formatVizelTooltip(option.label, option.shortcut)}
          tabindex={-1}
          onclick={() => handleOptionClick(option)}
        >
          <VizelIcon name={option.icon} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
