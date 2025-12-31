<script setup lang="ts">
import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/vue";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    initialContent?: string;
    showBubbleMenu?: boolean;
  }>(),
  {
    placeholder: "Type something...",
    initialContent: undefined,
    showBubbleMenu: true,
  }
);

const editor = useVizelEditor({
  placeholder: props.placeholder,
  initialContent: props.initialContent,
  features: {
    mathematics: true,
  },
});
</script>

<template>
  <EditorRoot :editor="editor">
    <EditorContent />
    <BubbleMenu v-if="showBubbleMenu" />
  </EditorRoot>
</template>
