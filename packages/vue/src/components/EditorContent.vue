<script setup lang="ts">
import { EditorContent as TiptapEditorContent } from "@tiptap/vue-3";
import type { Editor } from "@vizel/core";

defineProps<{
  editor: Editor | undefined;
  class?: string;
}>();
</script>

<template>
  <TiptapEditorContent
    v-if="editor"
    :editor="editor"
    :class="$props.class"
    data-vizel-content
  />
</template>
