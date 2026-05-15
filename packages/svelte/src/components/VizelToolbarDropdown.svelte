<script lang="ts" module>
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}
</script>

<script lang="ts">
import { buildVizelToolbarDropdownSkeleton, formatVizelTooltip } from "@vizel/core";
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

const spec = $derived(
  buildVizelToolbarDropdownSkeleton(dropdown, editor, isOpen, focusedIndex)
);

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
    aria-haspopup={spec.trigger.attrs["aria-haspopup"]}
    aria-expanded={spec.trigger.attrs["aria-expanded"]}
    title={spec.trigger.label}
    onclick={toggle}
    onkeydown={handleTriggerKeyDown}
  >
    <VizelIcon name={spec.trigger.iconName} />
    <span class="vizel-toolbar-dropdown-chevron">
      <VizelIcon name="chevronDown" />
    </span>
  </button>

  {#if isOpen}
    <div
      class="vizel-toolbar-dropdown-popover"
      role="listbox"
      aria-label={spec.popover.root["aria-label"]}
      aria-activedescendant={spec.popover.root["aria-activedescendant"]}
      tabindex={spec.popover.root.tabIndex}
      onkeydown={handleListKeyDown}
    >
      {#each spec.popover.sections as section (section.key)}
        {#each section.items as slot (slot.key)}
          <button
            id={slot.attrs.id}
            type="button"
            role="option"
            aria-selected={slot.attrs["aria-selected"]}
            class="vizel-toolbar-dropdown-option {slot.data.isActive ? 'is-active' : ''} {slot.data.isFocused ? 'is-focused' : ''}"
            disabled={!slot.data.isEnabled}
            title={formatVizelTooltip(slot.data.option.label, slot.data.option.shortcut)}
            tabindex={slot.attrs.tabIndex}
            onclick={() => handleOptionClick(slot.data.option)}
          >
            <VizelIcon name={slot.data.option.icon} />
            <span>{slot.data.option.label}</span>
          </button>
        {/each}
      {/each}
    </div>
  {/if}
</div>
