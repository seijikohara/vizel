<script lang="ts" module>
import type { Editor, VizelNodeTypeOption } from "@vizel/core";

export interface VizelNodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to vizelDefaultNodeTypes) */
  nodeTypes?: VizelNodeTypeOption[];
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { vizelDefaultNodeTypes, getVizelActiveNodeType } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelIcon from "./VizelIcon.svelte";

let { editor, nodeTypes = vizelDefaultNodeTypes, class: className }: VizelNodeSelectorProps = $props();

// Subscribe to editor state changes
const editorState = createVizelState(() => editor);

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerRef: HTMLDivElement | undefined = $state();
let dropdownRef: HTMLDivElement | undefined = $state();

const activeNodeType = $derived.by(() => {
  void editorState.current; // Trigger reactivity
  return getVizelActiveNodeType(editor, nodeTypes);
});

const currentLabel = $derived(activeNodeType?.label ?? "Text");
const currentIcon = $derived(activeNodeType?.icon ?? "paragraph");

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (containerRef && !containerRef.contains(event.target as Node)) {
    isOpen = false;
  }
}

$effect(() => {
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
});

// Focus the dropdown when it opens to ensure keyboard navigation works
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
      break;
    case "ArrowDown":
      event.preventDefault();
      focusedIndex = (focusedIndex + 1) % nodeTypes.length;
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex = (focusedIndex - 1 + nodeTypes.length) % nodeTypes.length;
      break;
    case "Enter":
    case " ": {
      event.preventDefault();
      const selectedNodeType = nodeTypes[focusedIndex];
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
      focusedIndex = nodeTypes.length - 1;
      break;
    default:
      // Allow other keys to propagate
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  nodeType.command(editor);
  isOpen = false;
}

function isNodeTypeActive(nodeType: VizelNodeTypeOption): boolean {
  void editorState.current; // Trigger reactivity
  return nodeType.isActive(editor);
}
</script>

<div
  bind:this={containerRef}
  class="vizel-node-selector {className ?? ''}"
  data-vizel-node-selector
>
  <button
    type="button"
    class="vizel-node-selector-trigger"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={`Current block type: ${currentLabel}`}
    title="Change block type"
    onclick={() => (isOpen = !isOpen)}
    onkeydown={handleKeyDown}
  >
    <span class="vizel-node-selector-icon">
      <VizelIcon name={currentIcon} />
    </span>
    <span class="vizel-node-selector-label">{currentLabel}</span>
    <span class="vizel-node-selector-chevron" aria-hidden="true">
      <VizelIcon name="chevronDown" />
    </span>
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownRef}
      class="vizel-node-selector-dropdown"
      role="listbox"
      aria-label="Block types"
      data-vizel-node-selector-dropdown
      tabindex="-1"
      onkeydown={handleKeyDown}
    >
      {#each nodeTypes as nodeType, index}
        {@const active = isNodeTypeActive(nodeType)}
        {@const focused = index === focusedIndex}
        <button
          type="button"
          role="option"
          aria-selected={active}
          class="vizel-node-selector-option {active ? 'is-active' : ''} {focused ? 'is-focused' : ''}"
          tabindex={focused ? 0 : -1}
          onclick={() => handleSelectNodeType(nodeType)}
          onmouseenter={() => (focusedIndex = index)}
        >
          <span class="vizel-node-selector-option-icon">
            <VizelIcon name={nodeType.icon} />
          </span>
          <span class="vizel-node-selector-option-label">{nodeType.label}</span>
          {#if active}
            <span class="vizel-node-selector-check" aria-hidden="true">
              <VizelIcon name="check" />
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
