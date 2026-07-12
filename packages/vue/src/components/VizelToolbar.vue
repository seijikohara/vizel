<script setup lang="ts">
import type { Editor, VizelLocale } from "@vizel/core";
import { computed } from "vue";

import { useVizelContextSafe } from "./VizelContext.ts";
import VizelToolbarDefault from "./VizelToolbarDefault.vue";

export interface VizelToolbarProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Whether to show the default toolbar (default: true). Set to false when using custom slot content. */
  showDefaultToolbar?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * Props passed to the default scoped slot. The slot only renders once the
 * editor resolves, so `editor` is non-null.
 */
export interface VizelToolbarSlotProps {
  /** The resolved Tiptap editor instance */
  editor: Editor;
}

const props = withDefaults(defineProps<VizelToolbarProps>(), {
  showDefaultToolbar: true,
});

defineSlots<{
  /** Replace the default toolbar buttons. Receives the resolved editor. */
  default?: (props: VizelToolbarSlotProps) => unknown;
}>();

const contextEditor = useVizelContextSafe();
const editor = computed(() => props.editor ?? contextEditor?.value ?? null);
</script>

<template>
  <div
    v-if="editor"
    :class="['vizel-toolbar', $props.class]"
    role="toolbar"
    :aria-label="props.locale?.toolbar?.ariaLabel ?? 'Formatting'"
    aria-orientation="horizontal"
  >
    <slot :editor="editor">
      <VizelToolbarDefault
        v-if="showDefaultToolbar"
        :editor="editor"
        v-bind="props.locale ? { locale: props.locale } : {}"
      />
    </slot>
  </div>
</template>
