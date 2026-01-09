<script setup lang="ts">
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/vue";

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
    diagram: true,
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelBubbleMenu v-if="showBubbleMenu" />
  </VizelProvider>
</template>
