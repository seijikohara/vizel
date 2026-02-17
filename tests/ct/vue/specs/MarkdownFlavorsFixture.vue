<script setup lang="ts">
import type { VizelMarkdownFlavor } from "@vizel/core";
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/vue";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    flavor?: VizelMarkdownFlavor;
  }>(),
  {
    flavor: "gfm",
  }
);

const markdownOutput = ref("");

const editor = useVizelEditor({
  flavor: props.flavor,
  features: {
    callout: true,
  },
});

function handleExport() {
  if (editor.value) {
    const md = editor.value.getMarkdown();
    markdownOutput.value = md;
  }
}

function handleInsertCallout() {
  if (editor.value) {
    editor.value
      .chain()
      .focus()
      .setCallout({ type: "info" })
      .insertContent("Test callout content")
      .run();
  }
}

function handleImportCalloutGfm() {
  if (editor.value) {
    editor.value.commands.setContent("> [!NOTE]\n> GFM callout content", {
      contentType: "markdown",
    });
  }
}

function handleImportCalloutObsidian() {
  if (editor.value) {
    editor.value.commands.setContent("> [!note]\n> Obsidian callout content", {
      contentType: "markdown",
    });
  }
}

function handleImportCalloutDocusaurus() {
  if (editor.value) {
    editor.value.commands.setContent(":::info\nDocusaurus callout content\n:::", {
      contentType: "markdown",
    });
  }
}
</script>

<template>
  <VizelProvider :editor="editor">
    <div class="toolbar">
      <button type="button" data-testid="insert-callout" @click="handleInsertCallout">
        Insert Callout
      </button>
      <button type="button" data-testid="export-button" @click="handleExport">
        Export
      </button>
      <button type="button" data-testid="import-callout-gfm" @click="handleImportCalloutGfm">
        Import GFM Callout
      </button>
      <button type="button" data-testid="import-callout-obsidian" @click="handleImportCalloutObsidian">
        Import Obsidian Callout
      </button>
      <button type="button" data-testid="import-callout-docusaurus" @click="handleImportCalloutDocusaurus">
        Import Docusaurus Callout
      </button>
    </div>
    <VizelEditor />
    <pre data-testid="markdown-output">{{ markdownOutput }}</pre>
  </VizelProvider>
</template>
