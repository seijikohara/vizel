<script setup lang="ts">
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/vue";

// Minimal editor fixture for the a11y suite. Boots the editor with a
// non-empty initial document so axe-core sees the rendered ProseMirror
// tree rather than the placeholder-only state.
const editor = useVizelEditor({
  placeholder: "Type something...",
  initialContent: "<h1>Heading</h1><p>Body text.</p>",
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
  </VizelProvider>
</template>
