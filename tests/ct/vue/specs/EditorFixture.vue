<script setup lang="ts">
import { useVizelEditor, VizelEditor, VizelProvider, VizelToolbar } from "@vizel/vue";

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
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelToolbar v-if="showBubbleMenu" />
  </VizelProvider>
</template>
