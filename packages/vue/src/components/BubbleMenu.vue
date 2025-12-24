<script setup lang="ts">
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { Editor } from "@tiptap/vue-3";
import { onBeforeUnmount, ref, useSlots, watch } from "vue";

const props = withDefaults(
  defineProps<{
    editor: Editor | undefined;
    class?: string;
    showDefaultToolbar?: boolean;
    pluginKey?: string;
    updateDelay?: number;
    shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
  }>(),
  {
    showDefaultToolbar: true,
    pluginKey: "vizelBubbleMenu",
    updateDelay: 100,
  }
);

const slots = useSlots();
const menuRef = ref<HTMLElement | null>(null);

watch(
  [() => props.editor, menuRef],
  ([editor, element], [, oldElement]) => {
    if (!(editor && element)) return;

    // Unregister old plugin if element changed
    if (oldElement) {
      editor.unregisterPlugin(props.pluginKey);
    }

    const plugin = BubbleMenuPlugin({
      pluginKey: props.pluginKey,
      editor,
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

    editor.registerPlugin(plugin);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (props.editor) {
    props.editor.unregisterPlugin(props.pluginKey);
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
