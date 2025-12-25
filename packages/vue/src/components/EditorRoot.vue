<script setup lang="ts">
import type { Editor } from "@vizel/core";
import { provide } from "vue";
import { EDITOR_CONTEXT_KEY } from "./EditorContext.ts";

export interface EditorRootProps {
  /** The editor instance */
  editor: Editor | null;
  /** Custom class name */
  class?: string;
}

const props = defineProps<EditorRootProps>();

provide(EDITOR_CONTEXT_KEY, () => props.editor);
</script>

<template>
  <div :class="$props.class" data-vizel-root>
    <slot />
  </div>
</template>
