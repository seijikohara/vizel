<script setup lang="ts">
import { VizelMarkdown } from "@vizel/core";
import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/vue";
import { ref } from "vue";

const markdownOutput = ref("");

const editor = useVizelEditor({
  extensions: [VizelMarkdown],
});

function handleExport() {
  if (editor.value) {
    const md = editor.value.getMarkdown();
    markdownOutput.value = md;
  }
}

function handleImport() {
  if (editor.value) {
    editor.value.commands.setContent("Hello **bold** world", {
      contentType: "markdown",
    });
  }
}

function handleImportCode() {
  if (editor.value) {
    editor.value.commands.setContent("```js\nconst x = 1;\n```", {
      contentType: "markdown",
    });
  }
}

function handleImportLink() {
  if (editor.value) {
    editor.value.commands.setContent("[Example](https://example.com)", {
      contentType: "markdown",
    });
  }
}

function handleImportStrikethrough() {
  if (editor.value) {
    editor.value.commands.setContent("This is ~~deleted~~ text", {
      contentType: "markdown",
    });
  }
}

function handleImportInlineCode() {
  if (editor.value) {
    editor.value.commands.setContent("Use the `variable` here", {
      contentType: "markdown",
    });
  }
}

function handleImportImage() {
  if (editor.value) {
    editor.value.commands.setContent("![Example](https://example.com/image.png)", {
      contentType: "markdown",
    });
  }
}

function handleImportOrderedList() {
  if (editor.value) {
    editor.value.commands.setContent("1. First\n2. Second\n3. Third", {
      contentType: "markdown",
    });
  }
}

function handleImportBlockquote() {
  if (editor.value) {
    editor.value.commands.setContent("> This is a quote", {
      contentType: "markdown",
    });
  }
}

function handleImportHr() {
  if (editor.value) {
    editor.value.commands.setContent("Above\n\n---\n\nBelow", {
      contentType: "markdown",
    });
  }
}

function handleImportTable() {
  if (editor.value) {
    editor.value.commands.setContent(
      "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |",
      { contentType: "markdown" }
    );
  }
}
</script>

<template>
  <VizelProvider :editor="editor">
    <div class="toolbar">
      <button type="button" data-testid="export-button" @click="handleExport">
        Export
      </button>
      <button type="button" data-testid="import-button" @click="handleImport">
        Import
      </button>
      <button type="button" data-testid="import-code-button" @click="handleImportCode">
        Import Code
      </button>
      <button type="button" data-testid="import-link-button" @click="handleImportLink">
        Import Link
      </button>
      <button type="button" data-testid="import-strikethrough-button" @click="handleImportStrikethrough">
        Import Strikethrough
      </button>
      <button type="button" data-testid="import-inline-code-button" @click="handleImportInlineCode">
        Import Inline Code
      </button>
      <button type="button" data-testid="import-image-button" @click="handleImportImage">
        Import Image
      </button>
      <button type="button" data-testid="import-ordered-list-button" @click="handleImportOrderedList">
        Import Ordered List
      </button>
      <button type="button" data-testid="import-blockquote-button" @click="handleImportBlockquote">
        Import Blockquote
      </button>
      <button type="button" data-testid="import-hr-button" @click="handleImportHr">
        Import HR
      </button>
      <button type="button" data-testid="import-table-button" @click="handleImportTable">
        Import Table
      </button>
    </div>
    <VizelEditor />
    <pre data-testid="markdown-output">{{ markdownOutput }}</pre>
  </VizelProvider>
</template>
