<script setup lang="ts">
import type { Editor } from "@tiptap/vue-3";
import { provide } from "vue";
import { EDITOR_INJECTION_KEY } from "./EditorContext.ts";

const props = defineProps<{
  editor: Editor | undefined;
  class?: string;
}>();

provide(EDITOR_INJECTION_KEY, () => props.editor);
</script>

<template>
  <div :class="$props.class" data-vizel-root>
    <slot />
  </div>
</template>
