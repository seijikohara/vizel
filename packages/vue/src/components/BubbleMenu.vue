<script setup lang="ts">
import { BubbleMenuPlugin, type Editor } from "@vizel/core";
import { computed, onBeforeUnmount, ref, useSlots, watch } from "vue";
import BubbleMenuToolbar from "./BubbleMenuToolbar.vue";
import { useEditorContextSafe } from "./EditorContext.ts";

export interface BubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor;
  /** Custom class name for the menu container */
  class?: string;
  /** Whether to show the default formatting toolbar */
  showDefaultToolbar?: boolean;
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
}

const props = withDefaults(defineProps<BubbleMenuProps>(), {
  showDefaultToolbar: true,
  pluginKey: "vizelBubbleMenu",
  updateDelay: 100,
});

const slots = useSlots();
const menuRef = ref<HTMLElement | null>(null);
const getContextEditor = useEditorContextSafe();
const editor = computed(() => props.editor ?? getContextEditor?.());

watch(
  [editor, menuRef],
  ([editorValue, element], [, oldElement]) => {
    if (!(editorValue && element)) return;

    // Unregister old plugin if element changed
    if (oldElement) {
      editorValue.unregisterPlugin(props.pluginKey);
    }

    const plugin = BubbleMenuPlugin({
      pluginKey: props.pluginKey,
      editor: editorValue,
      element,
      updateDelay: props.updateDelay,
      shouldShow: props.shouldShow
        ? ({ editor: e, from, to }) =>
            props.shouldShow?.({ editor: e as Editor, from, to }) ?? false
        : undefined,
      options: {
        placement: "top",
      },
    });

    editorValue.registerPlugin(plugin);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.unregisterPlugin(props.pluginKey);
  }
});
</script>

<template>
  <div
    v-if="editor"
    ref="menuRef"
    :class="['vizel-bubble-menu', $props.class]"
    data-vizel-bubble-menu
    style="visibility: hidden"
  >
    <slot v-if="slots.default" />
    <BubbleMenuToolbar v-else-if="showDefaultToolbar" :editor="editor" />
  </div>
</template>
