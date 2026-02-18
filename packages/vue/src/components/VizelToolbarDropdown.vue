<script setup lang="ts">
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { formatVizelTooltip } from "@vizel/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}

const props = defineProps<VizelToolbarDropdownProps>();

const isOpen = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);

const activeOption = computed(() => props.dropdown.getActiveOption?.(props.editor));
const triggerIcon = computed(() => activeOption.value?.icon ?? props.dropdown.icon);
const triggerLabel = computed(() => activeOption.value?.label ?? props.dropdown.label);

function close() {
  isOpen.value = false;
}

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleOptionClick(option: VizelToolbarDropdownAction["options"][number]) {
  option.run(props.editor);
  close();
}

function handleOutsideClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    close();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeydown);
  } else {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("keydown", handleKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    ref="containerRef"
    :class="['vizel-toolbar-dropdown', $props.class]"
    data-vizel-toolbar-dropdown
  >
    <button
      type="button"
      class="vizel-toolbar-dropdown-trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :title="triggerLabel"
      @click="toggle"
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
    >
      <button
        v-for="option in props.dropdown.options"
        :key="option.id"
        type="button"
        role="option"
        :aria-selected="option.isActive(props.editor)"
        :class="['vizel-toolbar-dropdown-option', option.isActive(props.editor) && 'is-active']"
        :disabled="!option.isEnabled(props.editor)"
        :title="formatVizelTooltip(option.label, option.shortcut)"
        @click="handleOptionClick(option)"
      >
        <VizelIcon :name="option.icon" />
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
