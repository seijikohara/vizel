<script setup lang="ts">
import { EditorContent as TiptapEditorContent, type Editor } from "@tiptap/vue-3";

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
