<script setup lang="ts">
import { getVizelMultiBlockSelectionState } from "@vizel/core";
import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/vue";
import { computed, onBeforeUnmount, watchEffect } from "vue";

const editor = useVizelEditor({
  immediatelyRender: false,
});

const updateCount = useVizelState(() => editor.value);

// Expose the editor on `window` for Playwright-driven selection setup.
// The scenarios drive selection through Tiptap's command bus because
// synthetic keystrokes for chord combinations behave differently
// across browsers.
watchEffect(() => {
  if (editor.value) {
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor.value;
  }
});
onBeforeUnmount(() => {
  delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
});

const summary = computed(() => {
  void updateCount.value;
  if (!editor.value) return "blocks=0";
  const rangeState = getVizelMultiBlockSelectionState(editor.value.state);
  return rangeState
    ? `blocks=${rangeState.blockPositions.length} from=${rangeState.from} to=${rangeState.to}`
    : "blocks=0";
});
</script>

<template>
  <VizelProvider :editor="editor">
    <div data-testid="multi-block-state">{{ summary }}</div>
    <VizelEditor />
  </VizelProvider>
</template>
