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
import { createVizelNodeTypes, vizelDefaultNodeTypes, getVizelActiveNodeType } from "@vizel/core";
import { createVizelState } from "../runes/createVizelState.svelte.js";
import VizelIcon from "./VizelIcon.svelte";

let { editor, nodeTypes, class: className, locale }: VizelNodeSelectorProps = $props();

const effectiveNodeTypes = $derived(nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes));

// Subscribe to editor state changes
const editorState = createVizelState(() => editor);

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerRef: HTMLDivElement | undefined = $state();
let dropdownRef: HTMLDivElement | undefined = $state();
let triggerRef: HTMLButtonElement | undefined = $state();

const activeNodeType = $derived.by(() => {
  void editorState.current; // Trigger reactivity
  return getVizelActiveNodeType(editor, effectiveNodeTypes);
});

const currentLabel = $derived(activeNodeType?.label ?? (locale?.nodeTypes.text ?? "Text"));
const currentIcon = $derived(activeNodeType?.icon ?? "paragraph");

// Close dropdown when clicking outside
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
      // Allow other keys to propagate
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  nodeType.command(editor);
  isOpen = false;
  triggerRef?.focus();
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
    bind:this={triggerRef}
    type="button"
    class="vizel-node-selector-trigger"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={(locale?.nodeSelector.currentBlockType ?? "Current block type: {type}").replace("{type}", currentLabel)}
    title={locale?.nodeSelector.changeBlockType ?? "Change block type"}
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
      aria-label={locale?.nodeSelector.blockTypes ?? "Block types"}
      data-vizel-node-selector-dropdown
      tabindex="-1"
      onkeydown={handleKeyDown}
    >
      {#each effectiveNodeTypes as nodeType, index}
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
