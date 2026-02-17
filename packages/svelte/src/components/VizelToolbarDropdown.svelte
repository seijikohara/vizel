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
let containerEl: HTMLDivElement | undefined = $state(undefined);

const activeOption = $derived(dropdown.getActiveOption?.(editor));
const triggerIcon = $derived(activeOption?.icon ?? dropdown.icon);
const triggerLabel = $derived(activeOption?.label ?? dropdown.label);

function close() {
  isOpen = false;
}

function toggle() {
  isOpen = !isOpen;
}

function handleOptionClick(option: VizelToolbarDropdownAction["options"][number]) {
  option.run(editor);
  close();
}

$effect(() => {
  if (!isOpen) return;

  function handleClick(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      close();
    }
  }
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
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
    type="button"
    class="vizel-toolbar-dropdown-trigger"
    aria-haspopup="true"
    aria-expanded={isOpen}
    title={triggerLabel}
    onclick={toggle}
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
    >
      {#each dropdown.options as option (option.id)}
        <button
          type="button"
          role="option"
          aria-selected={option.isActive(editor)}
          class="vizel-toolbar-dropdown-option {option.isActive(editor) ? 'is-active' : ''}"
          disabled={!option.isEnabled(editor)}
          title={formatVizelTooltip(option.label, option.shortcut)}
          onclick={() => handleOptionClick(option)}
        >
          <VizelIcon name={option.icon} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
