<script setup lang="ts">
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { buildVizelToolbarDropdownSkeleton, formatVizelTooltip } from "@vizel/core";
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

const spec = computed(() =>
  buildVizelToolbarDropdownSkeleton(props.dropdown, props.editor, isOpen.value, focusedIndex.value)
);

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
      :aria-haspopup="spec.trigger.attrs['aria-haspopup']"
      :aria-expanded="spec.trigger.attrs['aria-expanded']"
      :title="spec.trigger.label"
      @click="toggle"
      @keydown="handleTriggerKeyDown"
    >
      <VizelIcon :name="spec.trigger.iconName" />
      <span class="vizel-toolbar-dropdown-chevron">
        <VizelIcon name="chevronDown" />
      </span>
    </button>

    <div
      v-if="isOpen"
      class="vizel-toolbar-dropdown-popover"
      role="listbox"
      :aria-label="spec.popover.root['aria-label']"
      :aria-activedescendant="spec.popover.root['aria-activedescendant']"
      :tabindex="spec.popover.root.tabIndex"
      @keydown="handleListKeyDown"
    >
      <template v-for="section in spec.popover.sections" :key="section.key">
        <button
          v-for="slot in section.items"
          :id="slot.attrs.id"
          :key="slot.key"
          type="button"
          role="option"
          :aria-selected="slot.attrs['aria-selected']"
          :class="['vizel-toolbar-dropdown-option', slot.data.isActive && 'is-active', slot.data.isFocused && 'is-focused']"
          :disabled="!slot.data.isEnabled"
          :title="formatVizelTooltip(slot.data.option.label, slot.data.option.shortcut)"
          :tabindex="slot.attrs.tabIndex"
          @click="handleOptionClick(slot.data.option)"
        >
          <VizelIcon :name="slot.data.option.icon" />
          <span>{{ slot.data.option.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
