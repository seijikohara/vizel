<script setup lang="ts">
import {
  BubbleMenuPlugin,
  createVizelBubbleMenuEscapeController,
  type Editor,
  type VizelLocale,
} from "@vizel/core";
import { computed, ref, useSlots, watch } from "vue";
import VizelBubbleMenuDefault from "./VizelBubbleMenuDefault.vue";
import { useVizelContextSafe } from "./VizelContext.ts";

export interface VizelBubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name for the menu container */
  class?: string;
  /** Whether to show the default formatting menu */
  showDefaultMenu?: boolean;
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = withDefaults(defineProps<VizelBubbleMenuProps>(), {
  showDefaultMenu: true,
  pluginKey: "vizelBubbleMenu",
  updateDelay: 100,
});

const slots = useSlots();
const menuRef = ref<HTMLElement | null>(null);
const contextEditor = useVizelContextSafe();
const editor = computed(() => props.editor ?? contextEditor?.value ?? null);

// Use `onCleanup` so every register/listen pair has a guaranteed teardown that
// runs before the next watcher fire AND on unmount. The previous shape (manual
// `oldElement` check + a separate `onBeforeUnmount`) double-registered the
// ProseMirror plugin on the first editor-resolve because the initial early
// return left `oldElement` permanently undefined.
watch(
  [editor, menuRef],
  ([editorValue, element], _old, onCleanup) => {
    if (!(editorValue && element)) return;

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

    // Escape collapses the selection so the bubble menu hides via its
    // shouldShow predicate. The listener lives in a Core controller so
    // this component does not call `document.addEventListener` directly.
    const escapeController = createVizelBubbleMenuEscapeController({
      getEditor: () => editor.value,
    });
    escapeController.mount();

    onCleanup(() => {
      editorValue.unregisterPlugin(props.pluginKey);
      escapeController.unmount();
    });
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="editor"
    ref="menuRef"
    :class="['vizel-bubble-menu', $props.class]"
    data-vizel-bubble-menu
    role="toolbar"
    :aria-label="props.locale?.bubbleMenu?.ariaLabel ?? 'Text formatting'"
    style="visibility: hidden"
  >
    <slot v-if="slots.default" />
    <VizelBubbleMenuDefault v-else-if="showDefaultMenu" :editor="editor" :enable-embed="props.enableEmbed" v-bind="props.locale ? { locale: props.locale } : {}" />
  </div>
</template>
