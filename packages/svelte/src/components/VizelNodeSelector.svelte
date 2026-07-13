<script lang="ts" module>
import type { Editor, VizelLocale, VizelNodeTypeOption } from "@vizel/core";

export interface VizelNodeSelectorProps {
  /** Editor instance. Falls back to the editor from `VizelProvider`/`Vizel` context if omitted. */
  editor?: Editor | null;
  /** Custom node types (defaults to `vizelDefaultNodeTypes`) */
  nodeTypes?: readonly VizelNodeTypeOption[];
  /** Custom class name */
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}
</script>

<script lang="ts">
import {
  buildVizelNodeSelectorSpec,
  createVizelNodeTypes,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";

import { createVizelState } from "../runes/createVizelState.svelte.js";
import { getVizelContextSafe } from "./VizelContext.js";
import VizelIcon from "./VizelIcon.svelte";

let { editor: editorProp, nodeTypes, class: className, locale }: VizelNodeSelectorProps = $props();

const contextEditor = getVizelContextSafe();
const editor = $derived(editorProp ?? contextEditor?.current ?? null);

const effectiveNodeTypes = $derived(
  nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes)
);

const editorState = createVizelState(() => editor);

let isOpen = $state(false);
let focusedIndex = $state(0);
let containerRef: HTMLDivElement | undefined = $state();
let dropdownRef: HTMLDivElement | undefined = $state();
let triggerRef: HTMLButtonElement | undefined = $state();

const spec = $derived.by(() => {
  void editorState.version;
  if (!editor) return null;
  return buildVizelNodeSelectorSpec(editor, effectiveNodeTypes, isOpen, focusedIndex, locale);
});

// Pointer-outside dismissal routes through `createVizelDismissable` from
// `@vizel/headless`. The dropdown owns the keydown
// handler and resolves it through `buildVizelComboboxKeySpec`, so the
// controller only handles outside-pointer dismissal.
$effect(() => {
  if (!isOpen || !containerRef) return;
  const controller = createVizelDismissable({
    onPointerOutside: () => {
      isOpen = false;
    },
  });
  controller.mount(containerRef);
  return () => controller.unmount();
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

  // The open dropdown is a single-group listbox, so it delegates the
  // navigate / select / close verbs to the shared combobox resolver,
  // matching VizelSlashMenu and VizelMentionMenu. The dropdown
  // root (not a native button) owns the keydown, so Space activates like
  // Enter; normalise it before resolving. Tab (`groupNext`) has no group to
  // advance and falls through so focus leaves the dropdown.
  const action = buildVizelComboboxKeySpec({
    key: event.key === " " ? "Enter" : event.key,
    currentIndex: focusedIndex,
    length: effectiveNodeTypes.length,
  });
  if (action === null) return;
  // The open listbox owns its navigation keys. `stopPropagation` keeps the
  // Escape `close` from reaching the document-level bubble-menu escape
  // controller, which would otherwise collapse the selection and unmount the
  // host bubble menu (and the trigger) before focus can return to it. Tab
  // (`groupNext`) is the default no-op so focus can leave the dropdown.
  switch (action.type) {
    case "navigate":
      event.preventDefault();
      event.stopPropagation();
      focusedIndex = action.index;
      break;
    case "select": {
      event.preventDefault();
      event.stopPropagation();
      const selectedNodeType = effectiveNodeTypes[action.index];
      if (selectedNodeType) {
        handleSelectNodeType(selectedNodeType);
      }
      break;
    }
    case "close":
      event.preventDefault();
      event.stopPropagation();
      isOpen = false;
      triggerRef?.focus();
      break;
    default:
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  if (!editor) return;
  nodeType.command(editor);
  isOpen = false;
  triggerRef?.focus();
}
</script>

{#if editor && spec}
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
              class="vizel-node-selector-option {slot.data.isActive ? 'is-active' : ''} {slot.data
                .isFocused
                ? 'is-focused'
                : ''}"
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
{/if}
