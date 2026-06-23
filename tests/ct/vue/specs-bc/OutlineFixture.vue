<script setup lang="ts">
import {
  useVizelEditor,
  useVizelState,
  VizelEditor,
  VizelOutline,
  VizelProvider,
} from "@vizel/vue";
import { computed } from "vue";

const editor = useVizelEditor({
  immediatelyRender: false,
});

const updateCount = useVizelState(() => editor.value);

const cursorPos = computed(() => {
  void updateCount.value;
  return editor.value ? editor.value.state.selection.from : 0;
});
</script>

<template>
  <VizelProvider :editor="editor">
    <div data-testid="cursor-pos">{{ cursorPos }}</div>
    <VizelOutline />
    <VizelEditor />
  </VizelProvider>
</template>
