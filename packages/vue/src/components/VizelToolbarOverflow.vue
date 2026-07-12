<script setup lang="ts">
import type { Editor, VizelLocale, VizelToolbarActionItem } from "@vizel/core";
import { formatVizelTooltip, isVizelToolbarDropdownAction, vizelEnLocale } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

import VizelIcon from "./VizelIcon.vue";
import VizelToolbarButton from "./VizelToolbarButton.vue";
import VizelToolbarDropdown from "./VizelToolbarDropdown.vue";

export interface VizelToolbarOverflowProps {
  editor: Editor;
  actions: readonly VizelToolbarActionItem[];
  class?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = defineProps<VizelToolbarOverflowProps>();

const isOpen = ref(false);
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const triggerRef = useTemplateRef<HTMLButtonElement>("triggerRef");

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

// Pointer-outside and Escape dismissal route through `createVizelDismissable`.
// `captureEscape: true` runs the Escape handler in the
// capture phase and calls `stopImmediatePropagation()` so the editor's
// bubble-phase keymap does not also fire and reset the selection or drop
// focus from the trigger while the overflow popover owns Escape.
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

    <div v-if="isOpen" class="vizel-toolbar-overflow-popover" role="group">
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
