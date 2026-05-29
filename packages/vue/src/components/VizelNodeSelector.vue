<script setup lang="ts">
import {
  buildVizelNodeSelectorSpec,
  createVizelNodeTypes,
  type Editor,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import { useVizelContextSafe } from "./VizelContext.ts";
import VizelIcon from "./VizelIcon.vue";

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

const props = defineProps<VizelNodeSelectorProps>();

const contextEditor = useVizelContextSafe();
const resolvedEditor = computed<Editor | null>(() => props.editor ?? contextEditor?.value ?? null);

const effectiveNodeTypes = computed(
  () =>
    props.nodeTypes ?? (props.locale ? createVizelNodeTypes(props.locale) : vizelDefaultNodeTypes)
);

const editorStateVersion = useVizelState(() => resolvedEditor.value);

const isOpen = ref(false);
const focusedIndex = ref(0);
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const dropdownRef = useTemplateRef<HTMLDivElement>("dropdownRef");
const triggerRef = useTemplateRef<HTMLButtonElement>("triggerRef");

const spec = computed(() => {
  void editorStateVersion.value;
  const e = resolvedEditor.value;
  if (!e) return null;
  return buildVizelNodeSelectorSpec(
    e,
    effectiveNodeTypes.value,
    isOpen.value,
    focusedIndex.value,
    props.locale
  );
});

// The dropdown owns Escape and arrow-key navigation inside its own
// `handleKeyDown`; the controller only handles outside-pointer dismissal.
// `captureEscape` stays `false` because the dropdown's own keydown listener
// handles Escape via `event.preventDefault()` plus `triggerRef.value?.focus()`.
const dismissable = createVizelDismissable({
  onPointerOutside: () => {
    isOpen.value = false;
  },
});

watch(
  [isOpen, containerRef],
  ([open, container]) => {
    if (open && container) {
      dismissable.mount(container);
    } else {
      dismissable.unmount();
    }
  },
  { flush: "post" }
);

onMounted(() => {
  if (isOpen.value && containerRef.value) {
    dismissable.mount(containerRef.value);
  }
});

onBeforeUnmount(() => {
  dismissable.unmount();
});

watch(isOpen, (newValue) => {
  if (newValue) {
    void nextTick(() => {
      dropdownRef.value?.focus();
    });
  }
});

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      isOpen.value = true;
      focusedIndex.value = 0;
    }
    return;
  }

  switch (event.key) {
    case "Escape":
      event.preventDefault();
      isOpen.value = false;
      triggerRef.value?.focus();
      break;
    case "ArrowDown":
      event.preventDefault();
      focusedIndex.value = (focusedIndex.value + 1) % effectiveNodeTypes.value.length;
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex.value =
        (focusedIndex.value - 1 + effectiveNodeTypes.value.length) %
        effectiveNodeTypes.value.length;
      break;
    case "Enter":
    case " ": {
      event.preventDefault();
      const selectedNodeType = effectiveNodeTypes.value[focusedIndex.value];
      if (selectedNodeType) {
        handleSelectNodeType(selectedNodeType);
      }
      break;
    }
    case "Home":
      event.preventDefault();
      focusedIndex.value = 0;
      break;
    case "End":
      event.preventDefault();
      focusedIndex.value = effectiveNodeTypes.value.length - 1;
      break;
    default:
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  const e = resolvedEditor.value;
  if (!e) return;
  nodeType.command(e);
  isOpen.value = false;
  triggerRef.value?.focus();
}
</script>

<template>
  <div
    v-if="resolvedEditor && spec"
    ref="containerRef"
    :class="['vizel-node-selector', $props.class]"
    data-vizel-node-selector
  >
    <button
      ref="triggerRef"
      type="button"
      class="vizel-node-selector-trigger"
      :aria-haspopup="spec.trigger.attrs['aria-haspopup']"
      :aria-expanded="spec.trigger.attrs['aria-expanded']"
      :aria-label="spec.trigger.ariaLabel"
      :title="spec.trigger.title"
      @click="isOpen = !isOpen"
      @keydown="handleKeyDown"
    >
      <span class="vizel-node-selector-icon">
        <VizelIcon :name="spec.trigger.iconName" />
      </span>
      <span class="vizel-node-selector-label">{{ spec.trigger.label }}</span>
      <span class="vizel-node-selector-chevron" aria-hidden="true">
        <VizelIcon name="chevronDown" />
      </span>
    </button>

    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="vizel-node-selector-dropdown"
      role="listbox"
      :aria-label="spec.popover.root['aria-label']"
      data-vizel-node-selector-dropdown
      :tabindex="spec.popover.root.tabIndex"
      @keydown="handleKeyDown"
    >
      <template v-for="section in spec.popover.sections" :key="section.key">
        <button
          v-for="slot in section.items"
          :key="slot.key"
          type="button"
          role="option"
          :aria-selected="slot.attrs['aria-selected']"
          :class="[
            'vizel-node-selector-option',
            { 'is-active': slot.data.isActive },
            { 'is-focused': slot.data.isFocused },
          ]"
          :tabindex="slot.attrs.tabIndex"
          @click="handleSelectNodeType(slot.data.nodeType)"
          @mouseenter="focusedIndex = slot.index"
        >
          <span class="vizel-node-selector-option-icon">
            <VizelIcon :name="slot.data.nodeType.icon" />
          </span>
          <span class="vizel-node-selector-option-label">{{ slot.data.nodeType.label }}</span>
          <span
            v-if="slot.data.isActive"
            class="vizel-node-selector-check"
            aria-hidden="true"
          >
            <VizelIcon name="check" />
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
