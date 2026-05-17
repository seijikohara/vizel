<script lang="ts" module>
import type { Editor, VizelLocale, VizelNodeTypeOption } from "@vizel/core";

export interface VizelNodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to vizelDefaultNodeTypes) */
  nodeTypes?: VizelNodeTypeOption[];
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import { buildVizelNodeSelectorSpec, createVizelNodeTypes, vizelDefaultNodeTypes } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelIcon from "./VizelIcon.svelte";

let { editor, nodeTypes, class: className, locale }: VizelNodeSelectorProps = $props();

const effectiveNodeTypes = $derived(nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes));

const editorState = createVizelState(() => editor);

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerRef: HTMLDivElement | undefined = $state();
let dropdownRef: HTMLDivElement | undefined = $state();
let triggerRef: HTMLButtonElement | undefined = $state();

const spec = $derived.by(() => {
  void editorState.version;
  return buildVizelNodeSelectorSpec(editor, effectiveNodeTypes, isOpen, focusedIndex, locale);
});

function handleClickOutside(event: MouseEvent) {
  if (!(event.target instanceof Node)) return;
  if (containerRef && !containerRef.contains(event.target)) {
    isOpen = false;
  }
}

$effect(() => {
  if (!isOpen) return;
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
});

$effect(() => {
  if (isOpen && dropdownRef) {
    dropdownRef.focus();
  }
});

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      isOpen = true;
      focusedIndex = 0;
    }
    return;
  }

  switch (event.key) {
    case "Escape":
      event.preventDefault();
      isOpen = false;
      triggerRef?.focus();
      break;
    case "ArrowDown":
      event.preventDefault();
      focusedIndex = (focusedIndex + 1) % effectiveNodeTypes.length;
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex = (focusedIndex - 1 + effectiveNodeTypes.length) % effectiveNodeTypes.length;
      break;
    case "Enter":
    case " ": {
      event.preventDefault();
      const selectedNodeType = effectiveNodeTypes[focusedIndex];
      if (selectedNodeType) {
        handleSelectNodeType(selectedNodeType);
      }
      break;
    }
    case "Home":
      event.preventDefault();
      focusedIndex = 0;
      break;
    case "End":
      event.preventDefault();
      focusedIndex = effectiveNodeTypes.length - 1;
      break;
    default:
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  nodeType.command(editor);
  isOpen = false;
  triggerRef?.focus();
}
</script>

<div
  bind:this={containerRef}
  class="vizel-node-selector {className ?? ''}"
  data-vizel-node-selector
>
  <button
    bind:this={triggerRef}
    type="button"
    class="vizel-node-selector-trigger"
    aria-haspopup={spec.trigger.attrs["aria-haspopup"]}
    aria-expanded={spec.trigger.attrs["aria-expanded"]}
    aria-label={spec.trigger.ariaLabel}
    title={spec.trigger.title}
    onclick={() => (isOpen = !isOpen)}
    onkeydown={handleKeyDown}
  >
    <span class="vizel-node-selector-icon">
      <VizelIcon name={spec.trigger.iconName} />
    </span>
    <span class="vizel-node-selector-label">{spec.trigger.label}</span>
    <span class="vizel-node-selector-chevron" aria-hidden="true">
      <VizelIcon name="chevronDown" />
    </span>
  </button>

  {#if isOpen}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={dropdownRef}
      class="vizel-node-selector-dropdown"
      role="listbox"
      aria-label={spec.popover.root["aria-label"]}
      data-vizel-node-selector-dropdown
      tabindex={spec.popover.root.tabIndex}
      onkeydown={handleKeyDown}
    >
      {#each spec.popover.sections as section (section.key)}
        {#each section.items as slot (slot.key)}
          <button
            type="button"
            role="option"
            aria-selected={slot.attrs["aria-selected"]}
            class="vizel-node-selector-option {slot.data.isActive ? 'is-active' : ''} {slot.data.isFocused ? 'is-focused' : ''}"
            tabindex={slot.attrs.tabIndex}
            onclick={() => handleSelectNodeType(slot.data.nodeType)}
            onmouseenter={() => (focusedIndex = slot.index)}
          >
            <span class="vizel-node-selector-option-icon">
              <VizelIcon name={slot.data.nodeType.icon} />
            </span>
            <span class="vizel-node-selector-option-label">{slot.data.nodeType.label}</span>
            {#if slot.data.isActive}
              <span class="vizel-node-selector-check" aria-hidden="true">
                <VizelIcon name="check" />
              </span>
            {/if}
          </button>
        {/each}
      {/each}
    </div>
  {/if}
</div>
