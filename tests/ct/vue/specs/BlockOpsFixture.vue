<script setup lang="ts">
import {
  useVizelEditor,
  useVizelState,
  VizelEditor,
  VizelProvider,
  vizelBlockOperationCommands,
} from "@vizel/vue";
import { onBeforeUnmount, watch } from "vue";

interface TestWindow extends Window {
  vizelTestEditor?: unknown;
  vizelBlockOperationCommands?: unknown;
}

const editor = useVizelEditor({
  immediatelyRender: false,
});
useVizelState(() => editor.value);

watch(
  () => editor.value,
  (instance) => {
    if (instance) {
      const win = window as unknown as TestWindow;
      win.vizelTestEditor = instance;
      win.vizelBlockOperationCommands = vizelBlockOperationCommands;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  const win = window as unknown as TestWindow;
  delete win.vizelTestEditor;
  delete win.vizelBlockOperationCommands;
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
