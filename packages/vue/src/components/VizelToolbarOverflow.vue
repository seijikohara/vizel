<script setup lang="ts">
import type { Editor, VizelToolbarActionItem } from "@vizel/core";
import { formatVizelTooltip, isVizelToolbarDropdownAction } from "@vizel/core";
import { onBeforeUnmount, ref, watch } from "vue";
import VizelIcon from "./VizelIcon.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarDropdown from "./VizelToolbarDropdown.vue";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: VizelToolbarActionItem[];
  class?: string;
}

const props = defineProps<VizelToolbarOverflowProps>();

const isOpen = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);

function close() {
  isOpen.value = false;
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
    v-if="props.actions.length > 0"
    ref="containerRef"
    :class="['vizel-toolbar-overflow', $props.class]"
    data-vizel-toolbar-overflow
  >
    <button
      type="button"
      class="vizel-toolbar-overflow-trigger"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      aria-label="More actions"
      @click="toggle"
    >
      <VizelIcon name="ellipsis" />
    </button>

    <div
      v-if="isOpen"
      class="vizel-toolbar-overflow-popover"
      role="menu"
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
