<script lang="ts" module>
import type { Editor, NodeTypeOption } from "@vizel/core";

export interface NodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to defaultNodeTypes) */
  nodeTypes?: NodeTypeOption[];
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { defaultNodeTypes, getActiveNodeType } from "@vizel/core";
import { onMount } from "svelte";
import { createEditorState } from "../runes/createEditorState.svelte.ts";

let { editor, nodeTypes = defaultNodeTypes, class: className }: NodeSelectorProps = $props();

// Subscribe to editor state changes
const editorState = createEditorState(() => editor);

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerRef: HTMLDivElement | undefined = $state();

const activeNodeType = $derived.by(() => {
  void editorState.current; // Trigger reactivity
  return getActiveNodeType(editor, nodeTypes);
});

const currentLabel = $derived(activeNodeType?.label ?? "Text");
const currentIcon = $derived(activeNodeType?.icon ?? "¶");

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (containerRef && !containerRef.contains(event.target as Node)) {
    isOpen = false;
  }
}

onMount(() => {
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
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

function handleSelectNodeType(nodeType: NodeTypeOption) {
  nodeType.command(editor);
  isOpen = false;
}

function isNodeTypeActive(nodeType: NodeTypeOption): boolean {
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
    <span class="vizel-node-selector-icon">{currentIcon}</span>
    <span class="vizel-node-selector-label">{currentLabel}</span>
    <span class="vizel-node-selector-chevron" aria-hidden="true">▼</span>
  </button>

  {#if isOpen}
    <div
      class="vizel-node-selector-dropdown"
      role="listbox"
      aria-label="Block types"
      data-vizel-node-selector-dropdown
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
          <span class="vizel-node-selector-option-icon">{nodeType.icon}</span>
          <span class="vizel-node-selector-option-label">{nodeType.label}</span>
          {#if active}
            <span class="vizel-node-selector-check" aria-hidden="true">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
