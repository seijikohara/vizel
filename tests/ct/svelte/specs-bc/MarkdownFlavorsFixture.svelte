<script lang="ts">
import {
  createVizelEditor,
  VizelEditor,
  type VizelMarkdownFlavor,
  VizelProvider,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
} from "@vizel/svelte";

interface Props {
  flavor?: string;
}

const props = $props<Props>();

const FLAVOR_BY_NAME: Record<string, VizelMarkdownFlavor> = {
  [vizelCommonMarkFlavor.name]: vizelCommonMarkFlavor,
  [vizelGfmFlavor.name]: vizelGfmFlavor,
  [vizelObsidianFlavor.name]: vizelObsidianFlavor,
  [vizelDocusaurusFlavor.name]: vizelDocusaurusFlavor,
};

let markdownOutput = $state("");

const editor = createVizelEditor({
  markdown: { flavor: FLAVOR_BY_NAME[props.flavor ?? "gfm"] ?? vizelGfmFlavor },
  features: {
    content: {
      callout: true,
    },
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
