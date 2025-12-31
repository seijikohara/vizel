<script lang="ts">
import { Markdown } from "@vizel/core";
import { createVizelEditor, EditorContent, EditorRoot } from "@vizel/svelte";

let markdownOutput = $state("");

const editor = createVizelEditor({
  extensions: [Markdown],
});

function handleExport() {
  if (editor.current) {
    const md = editor.current.getMarkdown();
    markdownOutput = md;
  }
}

function handleImport() {
  if (editor.current) {
    editor.current.commands.setContent("Hello **bold** world", {
      contentType: "markdown",
    });
  }
}

function handleImportCode() {
  if (editor.current) {
    editor.current.commands.setContent("```js\nconst x = 1;\n```", {
      contentType: "markdown",
    });
  }
}

function handleImportLink() {
  if (editor.current) {
    editor.current.commands.setContent("[Example](https://example.com)", {
      contentType: "markdown",
    });
  }
}

function handleImportStrikethrough() {
  if (editor.current) {
    editor.current.commands.setContent("This is ~~deleted~~ text", {
      contentType: "markdown",
    });
  }
}

function handleImportInlineCode() {
  if (editor.current) {
    editor.current.commands.setContent("Use the `variable` here", {
      contentType: "markdown",
    });
  }
}

function handleImportImage() {
  if (editor.current) {
    editor.current.commands.setContent("![Example](https://example.com/image.png)", {
      contentType: "markdown",
    });
  }
}

function handleImportOrderedList() {
  if (editor.current) {
    editor.current.commands.setContent("1. First\n2. Second\n3. Third", {
      contentType: "markdown",
    });
  }
}

function handleImportBlockquote() {
  if (editor.current) {
    editor.current.commands.setContent("> This is a quote", {
      contentType: "markdown",
    });
  }
}

function handleImportHr() {
  if (editor.current) {
    editor.current.commands.setContent("Above\n\n---\n\nBelow", {
      contentType: "markdown",
    });
  }
}

function handleImportTable() {
  if (editor.current) {
    editor.current.commands.setContent(
      "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |",
      { contentType: "markdown" }
    );
  }
}
</script>

<EditorRoot editor={editor.current}>
  <div class="toolbar">
    <button type="button" data-testid="export-button" onclick={handleExport}>
      Export
    </button>
    <button type="button" data-testid="import-button" onclick={handleImport}>
      Import
    </button>
    <button type="button" data-testid="import-code-button" onclick={handleImportCode}>
      Import Code
    </button>
    <button type="button" data-testid="import-link-button" onclick={handleImportLink}>
      Import Link
    </button>
    <button type="button" data-testid="import-strikethrough-button" onclick={handleImportStrikethrough}>
      Import Strikethrough
    </button>
    <button type="button" data-testid="import-inline-code-button" onclick={handleImportInlineCode}>
      Import Inline Code
    </button>
    <button type="button" data-testid="import-image-button" onclick={handleImportImage}>
      Import Image
    </button>
    <button type="button" data-testid="import-ordered-list-button" onclick={handleImportOrderedList}>
      Import Ordered List
    </button>
    <button type="button" data-testid="import-blockquote-button" onclick={handleImportBlockquote}>
      Import Blockquote
    </button>
    <button type="button" data-testid="import-hr-button" onclick={handleImportHr}>
      Import HR
    </button>
    <button type="button" data-testid="import-table-button" onclick={handleImportTable}>
      Import Table
    </button>
  </div>
  <EditorContent />
  <pre data-testid="markdown-output">{markdownOutput}</pre>
</EditorRoot>
