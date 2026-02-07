<script setup lang="ts">
import { VizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelEditor,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
} from "@vizel/vue";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    mode?: "markdown" | "auto-save" | "default";
    storageKey?: string;
  }>(),
  {
    mode: "default",
    storageKey: "vizel-test-auto-save",
  }
);

const markdownOutput = ref("");

const editor = useVizelEditor(props.mode === "markdown" ? { extensions: [VizelMarkdown] } : {});

const autoSave =
  props.mode === "auto-save"
    ? useVizelAutoSave(() => editor.value, {
        debounceMs: 50,
        storage: "localStorage",
        key: props.storageKey,
      })
    : null;

function handleExport() {
  if (editor.value) {
    markdownOutput.value = editor.value.getMarkdown();
  }
}

function handleClear() {
  if (editor.value) {
    editor.value.commands.clearContent();
  }
}

function handleImportFromOutput() {
  if (editor.value && markdownOutput.value) {
    editor.value.commands.setContent(markdownOutput.value, {
      contentType: "markdown",
    });
  }
}
</script>

<template>
  <VizelProvider :editor="editor">
    <div v-if="mode === 'markdown'">
      <button type="button" data-testid="export-button" @click="handleExport">
        Export
      </button>
      <button type="button" data-testid="clear-button" @click="handleClear">
        Clear
      </button>
      <button type="button" data-testid="import-from-output-button" @click="handleImportFromOutput">
        Import From Output
      </button>
    </div>
    <VizelEditor />
    <VizelBubbleMenu v-if="mode === 'default'" />
    <pre v-if="mode === 'markdown'" data-testid="markdown-output">{{ markdownOutput }}</pre>
    <span v-if="autoSave" data-testid="save-status">{{ autoSave.status }}</span>
  </VizelProvider>
</template>
