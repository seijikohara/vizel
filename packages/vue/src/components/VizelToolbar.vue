<script setup lang="ts">
import type { Editor, VizelLocale } from "@vizel/core";
import { computed } from "vue";
import { useVizelContextSafe } from "./VizelContext.ts";
import VizelToolbarDefault from "./VizelToolbarDefault.vue";

export interface VizelToolbarProps {
  /** Editor instance. Falls back to context if not provided. */
  editor?: Editor | null;
  /** Custom class name */
  class?: string;
  /** Whether to show the default toolbar (default: true). Set to false when using custom slot content. */
  showDefaultToolbar?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

const props = withDefaults(defineProps<VizelToolbarProps>(), {
  showDefaultToolbar: true,
});

const getContextEditor = useVizelContextSafe();
const editor = computed(() => props.editor ?? getContextEditor?.() ?? null);
</script>

<template>
  <div v-if="editor" :class="['vizel-toolbar', $props.class]" role="toolbar" :aria-label="props.locale?.toolbar?.ariaLabel ?? 'Formatting'" aria-orientation="horizontal">
    <slot :editor="editor">
      <VizelToolbarDefault v-if="showDefaultToolbar" :editor="editor" v-bind="props.locale ? { locale: props.locale } : {}" />
    </slot>
  </div>
</template>
