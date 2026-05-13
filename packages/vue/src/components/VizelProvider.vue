<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { computed, provide } from "vue";
import { VIZEL_CONTEXT_KEY } from "./VizelContext.ts";

export interface VizelProviderProps {
  /** The editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
}

const props = defineProps<VizelProviderProps>();

provide(VIZEL_CONTEXT_KEY, () => props.editor);

// Always emit the `vizel-root` class so consumers get the CSS variable scope
// for free (.vizel-root { --vizel-* }). Matches the React provider behavior.
const rootClass = computed(() => (props.class ? `vizel-root ${props.class}` : "vizel-root"));
</script>

<template>
  <div :class="rootClass" data-vizel-root>
    <slot />
  </div>
</template>
