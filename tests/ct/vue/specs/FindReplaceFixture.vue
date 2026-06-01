<script setup lang="ts">
import {
  createVizelFindReplaceExtension,
  useVizelEditor,
  VizelEditor,
  VizelFindReplace,
  VizelProvider,
} from "@vizel/vue";

const editor = useVizelEditor({
  immediatelyRender: false,
  initialMarkdown: "alpha beta alpha gamma alpha",
  extensions: [createVizelFindReplaceExtension()],
});

function openReplace() {
  editor.value?.commands.openFindReplace("replace");
}
</script>

<template>
  <VizelProvider :editor="editor">
    <button type="button" data-testid="open-replace" @click="openReplace">open replace</button>
    <VizelFindReplace />
    <VizelEditor />
  </VizelProvider>
</template>
