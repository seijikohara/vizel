<script setup lang="ts">
import type { Editor, VizelLocale, VizelToolbarActionItem } from "@vizel/core";
import { formatVizelTooltip, isVizelToolbarDropdownAction, vizelEnLocale } from "@vizel/core";
import { onBeforeUnmount, ref, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarDropdown from "./VizelToolbarDropdown.vue";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: VizelToolbarActionItem[];
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelToolbarOverflowProps>();

const isOpen = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);

function close() {
  isOpen.value = false;
  triggerRef.value?.focus();
}

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleActionClick(action: VizelToolbarActionItem) {
  if (!isVizelToolbarDropdownAction(action)) {
    action.run(props.editor);
    close();
  }
}

function handleOutsideClick(e: MouseEvent) {
  if (!(e.target instanceof Node)) return;
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    close();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  }
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
    v-if="props.actions.length > 0"
    ref="containerRef"
    :class="['vizel-toolbar-overflow', $props.class]"
    data-vizel-toolbar-overflow
  >
    <button
      ref="triggerRef"
      type="button"
      class="vizel-toolbar-overflow-trigger"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-label="props.locale?.toolbar.moreActions ?? vizelEnLocale.toolbar.moreActions"
      @click="toggle"
    >
      <VizelIcon name="ellipsis" />
    </button>

    <div
      v-if="isOpen"
      class="vizel-toolbar-overflow-popover"
      role="group"
    >
      <template v-for="action in props.actions" :key="action.id">
        <VizelToolbarDropdown
          v-if="isVizelToolbarDropdownAction(action)"
          :editor="props.editor"
          :dropdown="action"
        />
        <VizelToolbarButton
          v-else
          :action="action.id"
          :is-active="action.isActive(props.editor)"
          :disabled="!action.isEnabled(props.editor)"
          :title="formatVizelTooltip(action.label, action.shortcut)"
          @click="handleActionClick(action)"
        >
          <VizelIcon :name="action.icon" />
        </VizelToolbarButton>
      </template>
    </div>
  </div>
</template>
