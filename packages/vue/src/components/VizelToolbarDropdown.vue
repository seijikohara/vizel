<script setup lang="ts">
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { formatVizelTooltip } from "@vizel/core";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}

const props = defineProps<VizelToolbarDropdownProps>();

const isOpen = ref(false);
const focusedIndex = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);

const activeOption = computed(() => props.dropdown.getActiveOption?.(props.editor));
const triggerIcon = computed(() => activeOption.value?.icon ?? props.dropdown.icon);
const triggerLabel = computed(() => activeOption.value?.label ?? props.dropdown.label);

function close() {
  isOpen.value = false;
  triggerRef.value?.focus();
}

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleOptionClick(option: VizelToolbarDropdownAction["options"][number]) {
  option.run(props.editor);
  close();
}

function handleOutsideClick(e: MouseEvent) {
  if (!(e.target instanceof Node)) return;
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    close();
  }
}

function handleEscapeKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  }
}

function handleTriggerKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    isOpen.value = true;
    focusedIndex.value = 0;
  }
}

function handleListKeyDown(e: KeyboardEvent) {
  const optionCount = props.dropdown.options.length;
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      focusedIndex.value = (focusedIndex.value + 1) % optionCount;
      break;
    case "ArrowUp":
      e.preventDefault();
      focusedIndex.value = (focusedIndex.value - 1 + optionCount) % optionCount;
      break;
    case "Home":
      e.preventDefault();
      focusedIndex.value = 0;
      break;
    case "End":
      e.preventDefault();
      focusedIndex.value = optionCount - 1;
      break;
    case "Enter":
    case " ": {
      e.preventDefault();
      const selected = props.dropdown.options[focusedIndex.value];
      if (selected?.isEnabled(props.editor)) {
        selected.run(props.editor);
        close();
      }
      break;
    }
    default:
      break;
  }
}

watch(isOpen, (open) => {
  if (open) {
    focusedIndex.value = 0;
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);
  } else {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("keydown", handleEscapeKey);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  document.removeEventListener("keydown", handleEscapeKey);
});
</script>

<template>
  <div
    ref="containerRef"
    :class="['vizel-toolbar-dropdown', $props.class]"
    data-vizel-toolbar-dropdown
  >
    <button
      ref="triggerRef"
      type="button"
      class="vizel-toolbar-dropdown-trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :title="triggerLabel"
      @click="toggle"
      @keydown="handleTriggerKeyDown"
    >
      <VizelIcon :name="triggerIcon" />
      <span class="vizel-toolbar-dropdown-chevron">
        <VizelIcon name="chevronDown" />
      </span>
    </button>

    <div
      v-if="isOpen"
      class="vizel-toolbar-dropdown-popover"
      role="listbox"
      :aria-label="props.dropdown.label"
      :aria-activedescendant="`vizel-dropdown-${props.dropdown.id}-${props.dropdown.options[focusedIndex]?.id}`"
      tabindex="0"
      @keydown="handleListKeyDown"
    >
      <button
        v-for="(option, index) in props.dropdown.options"
        :id="`vizel-dropdown-${props.dropdown.id}-${option.id}`"
        :key="option.id"
        type="button"
        role="option"
        :aria-selected="option.isActive(props.editor)"
        :class="['vizel-toolbar-dropdown-option', option.isActive(props.editor) && 'is-active', index === focusedIndex && 'is-focused']"
        :disabled="!option.isEnabled(props.editor)"
        :title="formatVizelTooltip(option.label, option.shortcut)"
        tabindex="-1"
        @click="handleOptionClick(option)"
      >
        <VizelIcon :name="option.icon" />
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
