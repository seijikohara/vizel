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
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
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

// Handle Escape key to hide bubble menu by collapsing selection
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && editor.value && !editor.value.view.state.selection.empty) {
    event.preventDefault();
    editor.value.commands.setTextSelection(editor.value.view.state.selection.to);
  }
}

watch(
  [editor, menuRef],
  ([editorValue, element], [, oldElement]) => {
    if (!(editorValue && element)) return;

    // Unregister old plugin if element changed
    if (oldElement) {
      editorValue.unregisterPlugin(props.pluginKey);
      document.removeEventListener("keydown", handleKeyDown);
    }

    const plugin = BubbleMenuPlugin({
      pluginKey: props.pluginKey,
      editor: editorValue,
      element,
      updateDelay: props.updateDelay,
      ...(props.shouldShow && {
        shouldShow: ({ editor: e, from, to }) =>
          props.shouldShow?.({ editor: e as Editor, from, to }) ?? false,
      }),
      options: {
        placement: "top",
      },
    });

    editorValue.registerPlugin(plugin);
    document.addEventListener("keydown", handleKeyDown);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.unregisterPlugin(props.pluginKey);
  }
  document.removeEventListener("keydown", handleKeyDown);
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
    <BubbleMenuToolbar v-else-if="showDefaultToolbar" :editor="editor" :enable-embed="props.enableEmbed" />
  </div>
</template>
