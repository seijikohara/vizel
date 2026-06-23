<script setup lang="ts">
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/vue";

const props = withDefaults(defineProps<{ placeholder?: string }>(), {
  placeholder: "Type something...",
});

const editor = useVizelEditor({
  placeholder: props.placeholder,
  features: {
    content: {
      mathematics: true,
    },
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelBubbleMenu />
  </VizelProvider>
</template>
