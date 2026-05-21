<script setup lang="ts">
import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/vue";
import { onBeforeUnmount, watchEffect } from "vue";

const editor = useVizelEditor({
  immediatelyRender: false,
});

useVizelState(() => editor.value);

watchEffect(() => {
  if (editor.value) {
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor.value;
  }
});
onBeforeUnmount(() => {
  delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
