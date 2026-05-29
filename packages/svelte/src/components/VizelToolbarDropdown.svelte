<script lang="ts" module>
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}
</script>

<script lang="ts">
import { buildVizelToolbarDropdownSpec, formatVizelTooltip } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { buildVizelListNavSpec } from "@vizel/headless/keyboard";
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
  buildVizelToolbarDropdownSpec(dropdown, editor, isOpen, focusedIndex)
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
  if (e.key === "Enter" || e.key === " ") {
    if (optionCount === 0) return;
    e.preventDefault();
    const selected = dropdown.options[focusedIndex];
    if (selected?.isEnabled(editor)) {
      selected.run(editor);
      close();
    }
    return;
  }
  // Delegate Arrow/Home/End to the headless builder, which short-circuits
  // on `optionCount === 0` instead of computing `NaN`.
  const next = buildVizelListNavSpec({ key: e.key, currentIndex: focusedIndex, length: optionCount });
  if (next === null) return;
  e.preventDefault();
  focusedIndex = next;
}

// Reset focus to the first option whenever the dropdown opens so keyboard
// navigation starts from a known anchor.
$effect(() => {
  if (isOpen) focusedIndex = 0;
});

// Pointer-outside and Escape dismissal route through `createVizelDismissable`
// from `@vizel/headless` so this component never attaches document listeners
// directly (ADR-0003, ADR-0007).
$effect(() => {
  if (!isOpen || !containerEl) return;

  // `captureEscape: true` runs the Escape handler in the capture phase and
  // calls `stopImmediatePropagation()`. The dropdown popover owns Escape
  // while open; otherwise the editor's bubble-phase keymap also fires and
  // resets the selection or drops focus from the trigger. ADR-0007
  // delegates this adapter-side contract to the controller.
  const controller = createVizelDismissable({
    onPointerOutside: () => close(),
    onEscape: () => close(),
    captureEscape: true,
  });
  controller.mount(containerEl);
  return () => controller.unmount();
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
