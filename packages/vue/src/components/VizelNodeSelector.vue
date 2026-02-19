<script setup lang="ts">
import {
  createVizelNodeTypes,
  type Editor,
  getVizelActiveNodeType,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useVizelState } from "../composables/useVizelState.ts";
import VizelIcon from "./VizelIcon.vue";

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

const props = defineProps<VizelNodeSelectorProps>();

const effectiveNodeTypes = computed(
  () =>
    props.nodeTypes ?? (props.locale ? createVizelNodeTypes(props.locale) : vizelDefaultNodeTypes)
);

// Subscribe to editor state changes
const editorStateVersion = useVizelState(() => props.editor);

const isOpen = ref(false);
const focusedIndex = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);

const activeNodeType = computed(() => {
  void editorStateVersion.value; // Trigger reactivity
  return getVizelActiveNodeType(props.editor, effectiveNodeTypes.value);
});

const currentLabel = computed(
  () => activeNodeType.value?.label ?? props.locale?.nodeTypes.text ?? "Text"
);
const currentIcon = computed(() => activeNodeType.value?.icon ?? "paragraph");

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (!(event.target instanceof Node)) return;
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

// Focus the dropdown when it opens to ensure keyboard navigation works
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
      // Allow other keys to propagate
      break;
  }
}

function handleSelectNodeType(nodeType: VizelNodeTypeOption) {
  nodeType.command(props.editor);
  isOpen.value = false;
  triggerRef.value?.focus();
}

function isNodeTypeActive(nodeType: VizelNodeTypeOption): boolean {
  void editorStateVersion.value; // Trigger reactivity
  return nodeType.isActive(props.editor);
}
</script>

<template>
  <div
    ref="containerRef"
    :class="['vizel-node-selector', $props.class]"
    data-vizel-node-selector
  >
    <button
      ref="triggerRef"
      type="button"
      class="vizel-node-selector-trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-label="(props.locale?.nodeSelector.currentBlockType ?? 'Current block type: {type}').replace('{type}', currentLabel)"
      :title="props.locale?.nodeSelector.changeBlockType ?? 'Change block type'"
      @click="isOpen = !isOpen"
      @keydown="handleKeyDown"
    >
      <span class="vizel-node-selector-icon">
        <VizelIcon :name="currentIcon" />
      </span>
      <span class="vizel-node-selector-label">{{ currentLabel }}</span>
      <span class="vizel-node-selector-chevron" aria-hidden="true">
        <VizelIcon name="chevronDown" />
      </span>
    </button>

    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="vizel-node-selector-dropdown"
      role="listbox"
      :aria-label="props.locale?.nodeSelector.blockTypes ?? 'Block types'"
      data-vizel-node-selector-dropdown
      tabindex="-1"
      @keydown="handleKeyDown"
    >
      <button
        v-for="(nodeType, index) in effectiveNodeTypes"
        :key="nodeType.name"
        type="button"
        role="option"
        :aria-selected="isNodeTypeActive(nodeType)"
        :class="[
          'vizel-node-selector-option',
          { 'is-active': isNodeTypeActive(nodeType) },
          { 'is-focused': index === focusedIndex },
        ]"
        :tabindex="index === focusedIndex ? 0 : -1"
        @click="handleSelectNodeType(nodeType)"
        @mouseenter="focusedIndex = index"
      >
        <span class="vizel-node-selector-option-icon">
          <VizelIcon :name="nodeType.icon" />
        </span>
        <span class="vizel-node-selector-option-label">{{ nodeType.label }}</span>
        <span
          v-if="isNodeTypeActive(nodeType)"
          class="vizel-node-selector-check"
          aria-hidden="true"
        >
          <VizelIcon name="check" />
        </span>
      </button>
    </div>
  </div>
</template>
