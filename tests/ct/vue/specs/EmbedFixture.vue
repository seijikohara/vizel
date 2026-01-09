<script setup lang="ts">
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/vue";

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
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelBubbleMenu enable-embed />
  </VizelProvider>
</template>
