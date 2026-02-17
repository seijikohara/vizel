<script lang="ts">
import type { VizelMarkdownFlavor } from "@vizel/core";
import { createVizelEditor, VizelEditor, VizelProvider } from "@vizel/svelte";

interface Props {
  flavor?: VizelMarkdownFlavor;
}

const props = $props<Props>();

let markdownOutput = $state("");

const editor = createVizelEditor({
  flavor: props.flavor ?? "gfm",
  features: {
    callout: true,
  },
});

function handleExport() {
  if (editor.current) {
    const md = editor.current.getMarkdown();
    markdownOutput = md;
  }
}

function handleInsertCallout() {
  if (editor.current) {
    editor.current
      .chain()
      .focus()
      .setCallout({ type: "info" })
      .insertContent("Test callout content")
      .run();
  }
}

function handleImportCalloutGfm() {
  if (editor.current) {
    editor.current.commands.setContent("> [!NOTE]\n> GFM callout content", {
      contentType: "markdown",
    });
  }
}

function handleImportCalloutObsidian() {
  if (editor.current) {
    editor.current.commands.setContent("> [!note]\n> Obsidian callout content", {
      contentType: "markdown",
    });
  }
}

function handleImportCalloutDocusaurus() {
  if (editor.current) {
    editor.current.commands.setContent(":::info\nDocusaurus callout content\n:::", {
      contentType: "markdown",
    });
  }
}
</script>

<VizelProvider editor={editor.current}>
  <div class="toolbar">
    <button type="button" data-testid="insert-callout" onclick={handleInsertCallout}>
      Insert Callout
    </button>
    <button type="button" data-testid="export-button" onclick={handleExport}>
      Export
    </button>
    <button type="button" data-testid="import-callout-gfm" onclick={handleImportCalloutGfm}>
      Import GFM Callout
    </button>
    <button type="button" data-testid="import-callout-obsidian" onclick={handleImportCalloutObsidian}>
      Import Obsidian Callout
    </button>
    <button type="button" data-testid="import-callout-docusaurus" onclick={handleImportCalloutDocusaurus}>
      Import Docusaurus Callout
    </button>
  </div>
  <VizelEditor />
  <pre data-testid="markdown-output">{markdownOutput}</pre>
</VizelProvider>
