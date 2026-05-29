<script setup lang="ts">
import {
  BubbleMenuPlugin,
  createVizelBubbleMenuEscapeController,
  type Editor,
  type VizelLocale,
} from "@vizel/core";
import { computed, useTemplateRef, watch } from "vue";
import VizelBubbleMenuDefault from "./VizelBubbleMenuDefault.vue";
import { useVizelContextSafe } from "./VizelContext.ts";

export interface VizelBubbleMenuProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
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

// The default slot replaces the built-in formatting menu wholesale; the
// consumer supplies its own buttons and reads the editor from the
// surrounding `VizelProvider` / `Vizel` context, so the slot passes no
// props. Typing it keeps `slots.default` discoverable under Volar.
const slots = defineSlots<{
  default?: () => unknown;
}>();
const menuRef = useTemplateRef<HTMLElement>("menuRef");
const contextEditor = useVizelContextSafe();
const editor = computed(() => props.editor ?? contextEditor?.value ?? null);

// Use `onCleanup` so every register/listen pair has a guaranteed teardown that
// runs before the next watcher fire AND on unmount. The previous shape (manual
// `oldElement` check + a separate `onBeforeUnmount`) double-registered the
// ProseMirror plugin on the first editor-resolve because the initial early
// return left `oldElement` permanently undefined.
// Track `shouldShow` *presence* (not identity) so the watcher re-registers
// the plugin when the prop toggles between `undefined` and a function. An
// identity-stable change of a continuously-defined `shouldShow` flows
// through `props.shouldShow?.(...)` inside the wrapper without re-firing.
// The previous shape registered the conditional `...(props.shouldShow && {...})`
// spread once at plugin construction — toggling from `undefined` → defined
// silently skipped the wrapper, and the reverse pinned the bubble menu
// hidden.
watch(
  [editor, menuRef, () => props.shouldShow !== undefined],
  ([editorValue, element], _old, onCleanup) => {
    if (!(editorValue && element)) return;

    const plugin = BubbleMenuPlugin({
      pluginKey: props.pluginKey,
      editor: editorValue,
      element,
      updateDelay: props.updateDelay,
      ...(props.shouldShow !== undefined && {
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
    // this component does not attach the listener directly.
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
