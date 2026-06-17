<script setup lang="ts">
import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { buildVizelToolbarDropdownSpec, formatVizelTooltip } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { buildVizelListNavSpec } from "@vizel/headless/keyboard";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  class?: string;
}

const props = defineProps<VizelToolbarDropdownProps>();

const isOpen = ref(false);
const focusedIndex = ref(0);
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const triggerRef = useTemplateRef<HTMLButtonElement>("triggerRef");

const spec = computed(() =>
  buildVizelToolbarDropdownSpec(props.dropdown, props.editor, isOpen.value, focusedIndex.value)
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

function handleTriggerKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    isOpen.value = true;
    focusedIndex.value = 0;
  }
}

function handleListKeyDown(e: KeyboardEvent) {
  const optionCount = props.dropdown.options.length;
  if (e.key === "Enter" || e.key === " ") {
    if (optionCount === 0) return;
    e.preventDefault();
    const selected = props.dropdown.options[focusedIndex.value];
    if (selected?.isEnabled(props.editor)) {
      selected.run(props.editor);
      close();
    }
    return;
  }
  // Delegate Arrow/Home/End to the headless builder, which short-circuits
  // on `optionCount === 0` instead of computing `NaN`.
  const next = buildVizelListNavSpec({
    key: e.key,
    currentIndex: focusedIndex.value,
    length: optionCount,
  });
  if (next === null) return;
  e.preventDefault();
  focusedIndex.value = next;
}

watch(isOpen, (open) => {
  if (open) focusedIndex.value = 0;
});

// Pointer-outside and Escape dismissal route through `createVizelDismissable`.
// `captureEscape: true` runs the Escape handler in the
// capture phase and calls `stopImmediatePropagation()` so the editor's
// bubble-phase keymap does not also fire and reset the selection or drop
// focus from the trigger while the dropdown popover owns Escape.
const dismissable = createVizelDismissable({
  onPointerOutside: close,
  onEscape: close,
  captureEscape: true,
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
