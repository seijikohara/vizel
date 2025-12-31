<script setup lang="ts">
import { defaultNodeTypes, type Editor, getActiveNodeType, type NodeTypeOption } from "@vizel/core";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useEditorState } from "../composables/useEditorState.ts";

export interface NodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to defaultNodeTypes) */
  nodeTypes?: NodeTypeOption[];
  /** Custom class name */
  class?: string;
}

const props = withDefaults(defineProps<NodeSelectorProps>(), {
  nodeTypes: () => defaultNodeTypes,
});

// Subscribe to editor state changes
const editorStateVersion = useEditorState(() => props.editor);

const isOpen = ref(false);
const focusedIndex = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);

const activeNodeType = computed(() => {
  void editorStateVersion.value; // Trigger reactivity
  return getActiveNodeType(props.editor, props.nodeTypes);
});

const currentLabel = computed(() => activeNodeType.value?.label ?? "Text");
const currentIcon = computed(() => activeNodeType.value?.icon ?? "¶");

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

// Focus the dropdown when it opens to ensure keyboard navigation works
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
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
      break;
    case "ArrowDown":
      event.preventDefault();
      focusedIndex.value = (focusedIndex.value + 1) % props.nodeTypes.length;
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex.value =
        (focusedIndex.value - 1 + props.nodeTypes.length) % props.nodeTypes.length;
      break;
    case "Enter":
    case " ": {
      event.preventDefault();
      const selectedNodeType = props.nodeTypes[focusedIndex.value];
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
      focusedIndex.value = props.nodeTypes.length - 1;
      break;
    default:
      // Allow other keys to propagate
      break;
  }
}

function handleSelectNodeType(nodeType: NodeTypeOption) {
  nodeType.command(props.editor);
  isOpen.value = false;
}

function isNodeTypeActive(nodeType: NodeTypeOption): boolean {
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
      type="button"
      class="vizel-node-selector-trigger"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-label="`Current block type: ${currentLabel}`"
      title="Change block type"
      @click="isOpen = !isOpen"
      @keydown="handleKeyDown"
    >
      <span class="vizel-node-selector-icon">{{ currentIcon }}</span>
      <span class="vizel-node-selector-label">{{ currentLabel }}</span>
      <span class="vizel-node-selector-chevron" aria-hidden="true">▼</span>
    </button>

    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="vizel-node-selector-dropdown"
      role="listbox"
      aria-label="Block types"
      data-vizel-node-selector-dropdown
      tabindex="-1"
      @keydown="handleKeyDown"
    >
      <button
        v-for="(nodeType, index) in props.nodeTypes"
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
        <span class="vizel-node-selector-option-icon">{{ nodeType.icon }}</span>
        <span class="vizel-node-selector-option-label">{{ nodeType.label }}</span>
        <span
          v-if="isNodeTypeActive(nodeType)"
          class="vizel-node-selector-check"
          aria-hidden="true"
        >
          ✓
        </span>
      </button>
    </div>
  </div>
</template>
