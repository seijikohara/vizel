<script lang="ts">
import { VizelMarkdown } from "@vizel/core";
import {
  createVizelAutoSave,
  createVizelEditor,
  VizelBubbleMenu,
  VizelEditor,
  VizelProvider,
} from "@vizel/svelte";

interface Props {
  mode?: "markdown" | "auto-save" | "default";
  storageKey?: string;
}

const props = $props<Props>();

const currentMode = props.mode ?? "default";
const currentStorageKey = props.storageKey ?? "vizel-test-auto-save";

let markdownOutput = $state("");

const editor = createVizelEditor(currentMode === "markdown" ? { extensions: [VizelMarkdown] } : {});

const autoSave =
  currentMode === "auto-save"
    ? createVizelAutoSave(() => editor.current, {
        debounceMs: 50,
        storage: "localStorage",
        key: currentStorageKey,
      })
    : null;

function handleExport() {
  if (editor.current) {
    markdownOutput = editor.current.getMarkdown();
  }
}

function handleClear() {
  if (editor.current) {
    editor.current.commands.clearContent();
  }
}

function handleImportFromOutput() {
  if (editor.current && markdownOutput) {
    editor.current.commands.setContent(markdownOutput, {
      contentType: "markdown",
    });
  }
}
</script>

<VizelProvider editor={editor.current}>
  {#if currentMode === "markdown"}
    <div>
      <button type="button" data-testid="export-button" onclick={handleExport}>
        Export
      </button>
      <button type="button" data-testid="clear-button" onclick={handleClear}>
        Clear
      </button>
      <button type="button" data-testid="import-from-output-button" onclick={handleImportFromOutput}>
        Import From Output
      </button>
    </div>
  {/if}
  <VizelEditor />
  {#if currentMode === "default"}
    <VizelBubbleMenu />
  {/if}
  {#if currentMode === "markdown"}
    <pre data-testid="markdown-output">{markdownOutput}</pre>
  {/if}
  {#if autoSave}
    <span data-testid="save-status">{autoSave.status}</span>
  {/if}
</VizelProvider>
