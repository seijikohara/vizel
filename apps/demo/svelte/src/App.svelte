<script lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import {
  createVizelAutoSave,
  createVizelState,
  Vizel,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/svelte";
import { initialMarkdown } from "../../shared/content";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.svelte";

let showJson = $state(false);
let jsonInput = $state("");

let showMarkdown = $state(false);
let markdownInput = $state("");

// Store editor reference from Vizel component
let editorRef: Editor | null = $state(null);

// Track editor state for character/word count
const updateCount = createVizelState(() => editorRef);
const editorState = $derived.by(() => {
  void updateCount.current;
  return getVizelEditorState(editorRef);
});

// Auto-save functionality
const autoSave = createVizelAutoSave(() => editorRef, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-svelte",
});

function handleCreate({ editor }: { editor: Editor }) {
  editorRef = editor;
  jsonInput = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput = editor.getMarkdown();
}

function handleUpdate({ editor }: { editor: Editor }) {
  jsonInput = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput = editor.getMarkdown();
}

function handleMarkdownChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  markdownInput = value;
  if (editorRef) {
    editorRef.commands.setContent(value, { contentType: "markdown" });
  }
}

function handleJsonChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  jsonInput = value;
  try {
    const parsed = JSON.parse(value) as JSONContent;
    if (editorRef) {
      editorRef.commands.setContent(parsed);
    }
  } catch {
    // Invalid JSON, ignore
  }
}
</script>

<VizelThemeProvider defaultTheme="system" storageKey="vizel-theme">
<div class="app">
  <header class="header">
    <div class="header-content">
      <svg class="framework-logo" viewBox="0 0 98.1 118">
        <path fill="currentColor" d="M91.8 15.6C80.9-.1 59.2-4.7 43.6 5.2L16.1 22.8C8.6 27.5 3.4 35.2 1.9 43.9c-1.3 7.3-.2 14.8 3.3 21.3-2.4 3.6-4 7.6-4.7 11.8-1.6 8.9.5 18.1 5.7 25.4 11 15.7 32.6 20.3 48.2 10.4l27.5-17.5c7.5-4.7 12.7-12.4 14.2-21.1 1.3-7.3.2-14.8-3.3-21.3 2.4-3.6 4-7.6 4.7-11.8 1.7-9-.4-18.2-5.7-25.5"/>
        <path fill="rgba(255,255,255,0.3)" d="M40.9 103.9c-8.9 2.3-18.2-1.2-23.4-8.7-3.2-4.4-4.4-9.9-3.5-15.3.2-.9.4-1.7.6-2.6l.5-1.6 1.4 1c3.3 2.4 6.9 4.2 10.8 5.4l1 .3-.1 1c-.1 1.4.3 2.9 1.1 4.1 1.6 2.3 4.4 3.4 7.1 2.7.6-.2 1.2-.4 1.7-.7L65.5 72c1.4-.9 2.3-2.2 2.6-3.8.3-1.6-.1-3.3-1-4.6-1.6-2.3-4.4-3.3-7.1-2.6-.6.2-1.2.4-1.7.7l-10.5 6.7c-1.7 1.1-3.6 1.9-5.6 2.4-8.9 2.3-18.2-1.2-23.4-8.7-3.1-4.4-4.4-9.9-3.4-15.3.9-5.2 4.1-9.9 8.6-12.7l27.5-17.5c1.7-1.1 3.6-1.9 5.6-2.5 8.9-2.3 18.2 1.2 23.4 8.7 3.2 4.4 4.4 9.9 3.5 15.3-.2.9-.4 1.7-.7 2.6l-.5 1.6-1.4-1c-3.3-2.4-6.9-4.2-10.8-5.4l-1-.3.1-1c.1-1.4-.3-2.9-1.1-4.1-1.6-2.3-4.4-3.3-7.1-2.6-.6.2-1.2.4-1.7.7L32.4 46c-1.4.9-2.3 2.2-2.6 3.8s.1 3.3 1 4.6c1.6 2.3 4.4 3.3 7.1 2.6.6-.2 1.2-.4 1.7-.7l10.5-6.7c1.7-1.1 3.6-1.9 5.6-2.5 8.9-2.3 18.2 1.2 23.4 8.7 3.2 4.4 4.4 9.9 3.5 15.3-.9 5.2-4.1 9.9-8.6 12.7l-27.5 17.5c-1.7 1.1-3.6 1.9-5.6 2.5"/>
      </svg>
      <div class="header-text">
        <h1>Vizel Editor</h1>
        <span class="framework-badge">Svelte 5</span>
      </div>
      <ThemeToggle />
    </div>
    <p class="header-description">
      A block-based rich text editor with slash commands and inline formatting
    </p>
  </header>

  <main class="main">
    <div class="editor-container">
      <Vizel
        {initialMarkdown}
        autofocus="end"
        class="editor-content"
        enableEmbed
        features={{
          markdown: true,
          mathematics: true,
          embed: true,
          details: true,
          diagram: true,
          image: {
            onUpload: mockUploadImage,
            maxFileSize: 10 * 1024 * 1024,
            onValidationError: (error) => alert(`Validation error: ${error.message}`),
            onUploadError: (error) => alert(`Upload failed: ${error.message}`),
          },
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <div class="status-bar">
        <VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
        <span class="status-divider">·</span>
        <span class="status-item">{editorState.characterCount} characters</span>
        <span class="status-divider">·</span>
        <span class="status-item">{editorState.wordCount} words</span>
      </div>
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showMarkdown = !showMarkdown}
      >
        <span class="output-toggle-icon">{showMarkdown ? '−' : '+'}</span>
        <span>Markdown</span>
      </button>
      {#if showMarkdown}
        <textarea
          class="sync-textarea"
          value={markdownInput}
          placeholder="Edit Markdown here..."
          rows="12"
          oninput={handleMarkdownChange}
        ></textarea>
      {/if}
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showJson = !showJson}
      >
        <span class="output-toggle-icon">{showJson ? '−' : '+'}</span>
        <span>JSON</span>
      </button>
      {#if showJson}
        <textarea
          class="sync-textarea"
          value={jsonInput}
          placeholder="Edit JSON here..."
          rows="12"
          oninput={handleJsonChange}
        ></textarea>
      {/if}
    </div>
  </main>

  <footer class="footer">
    <p>
      Built with <span class="footer-highlight">@vizel/svelte</span>
    </p>
  </footer>
</div>
</VizelThemeProvider>
