<script setup lang="ts">
import {
  useVizelEditor,
  useVizelState,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
  vizelDefaultFeatures,
} from "@vizel/vue";
import { onBeforeUnmount, watch } from "vue";

// Fixture for host-CSS-reset scenarios. See the React CssResetFixture for the
// rationale: curated features plus the editor exposed on window for rich seeding.
interface TestWindow extends Window {
  vizelTestEditor?: unknown;
}

const editor = useVizelEditor({
  immediatelyRender: false,
  features: vizelDefaultFeatures(),
});
useVizelState(() => editor.value);

watch(
  () => editor.value,
  (instance) => {
    if (instance) {
      (window as unknown as TestWindow).vizelTestEditor = instance;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  delete (window as unknown as TestWindow).vizelTestEditor;
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelBubbleMenu />
  </VizelProvider>
</template>
