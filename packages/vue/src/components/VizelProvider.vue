<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { provide } from "vue";
import { VIZEL_CONTEXT_KEY } from "./VizelContext.ts";

export interface VizelProviderProps {
  /** The editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
}

const props = defineProps<VizelProviderProps>();

provide(VIZEL_CONTEXT_KEY, () => props.editor);
</script>

<template>
  <div :class="$props.class" data-vizel-root>
    <slot />
  </div>
</template>
