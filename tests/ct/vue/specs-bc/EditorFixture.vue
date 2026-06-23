<script setup lang="ts">
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/vue";

const editor = useVizelEditor({
  placeholder: "Type something...",
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
