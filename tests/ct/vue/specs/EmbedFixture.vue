<script setup lang="ts">
import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/vue";

export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

const props = withDefaults(defineProps<EmbedFixtureProps>(), {
  placeholder: "Type something...",
});

const editor = useVizelEditor({
  placeholder: props.placeholder,
  initialContent: props.initialContent,
  features: {
    embed: true,
  },
});
</script>

<template>
  <EditorRoot :editor="editor">
    <EditorContent />
    <BubbleMenu enable-embed />
  </EditorRoot>
</template>
