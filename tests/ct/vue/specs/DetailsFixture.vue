<script setup lang="ts">
import { EditorContent, EditorRoot, useVizelEditor } from "@vizel/vue";

export interface DetailsFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

const props = withDefaults(defineProps<DetailsFixtureProps>(), {
  placeholder: "Type something...",
});

const editor = useVizelEditor({
  placeholder: props.placeholder,
  initialContent: props.initialContent,
  features: {
    details: true,
  },
});
</script>

<template>
  <EditorRoot :editor="editor">
    <EditorContent />
  </EditorRoot>
</template>
