<script setup lang="ts">
import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/vue";
import { onBeforeUnmount, watch } from "vue";

const editor = useVizelEditor({
  immediatelyRender: false,
});
useVizelState(() => editor.value);

watch(
  () => editor.value,
  (instance) => {
    if (instance) {
      (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = instance;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
