<script lang="ts">
import {
  BubbleMenu,
  EditorContent,
  getEditorState,
  type JSONContent,
  useEditorState,
  useVizelEditor,
} from "@vizel/svelte";
import { initialContent } from "../../shared/content";
import { mockUploadImage } from "../../shared/utils";

let output: JSONContent | null = $state(null);
let showOutput = $state(false);
let markdownOutput = $state("");
let showMarkdown = $state(false);
let markdownInput = $state("");
let showMarkdownInput = $state(false);

const editor = useVizelEditor({
  initialContent,
  autofocus: "end",
  features: {
    markdown: true,
    mathematics: true,
    image: {
      onUpload: mockUploadImage,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      onValidationError: (error) => {
        alert(`Validation error: ${error.message}`);
      },
      onUploadError: (error) => {
        alert(`Upload failed: ${error.message}`);
      },
    },
  },
  onUpdate: ({ editor: e }) => {
    output = e.getJSON();
    markdownOutput = e.getMarkdown();
  },
  onCreate: ({ editor: e }) => {
    output = e.getJSON();
    markdownOutput = e.getMarkdown();
  },
});

// Track editor state for character/word count
const updateCount = useEditorState(() => editor.current);
const editorState = $derived.by(() => {
  void updateCount.current;
  return getEditorState(editor.current);
});

function handleImportMarkdown() {
  if (editor.current && markdownInput.trim()) {
    editor.current.commands.setContent(markdownInput, { contentType: "markdown" });
    markdownInput = "";
    showMarkdownInput = false;
  }
}
</script>

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
    </div>
    <p class="header-description">
      A block-based rich text editor with slash commands and inline formatting
    </p>
  </header>

  <main class="main">
    <div class="features-bar">
      <div class="feature-tag">
        <span class="feature-icon">/</span>
        <span>Slash Commands</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">B</span>
        <span>Bubble Menu</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">T</span>
        <span>Tables</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">L</span>
        <span>Links</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">U</span>
        <span>Image Upload</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">M</span>
        <span>Markdown</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">#</span>
        <span>Character Count</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">{"</>"}</span>
        <span>Code Blocks</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">∑</span>
        <span>Math (LaTeX)</span>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-root">
        <EditorContent editor={editor.current} class="editor-content" />
        {#if editor.current}
          <BubbleMenu editor={editor.current} />
        {/if}
      </div>
      <div class="status-bar">
        <span class="status-item">{editorState.characterCount} characters</span>
        <span class="status-divider">·</span>
        <span class="status-item">{editorState.wordCount} words</span>
      </div>
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showMarkdownInput = !showMarkdownInput}
      >
        <span class="output-toggle-icon">{showMarkdownInput ? '−' : '+'}</span>
        <span>Markdown Import</span>
      </button>
      {#if showMarkdownInput}
        <div class="markdown-input-container">
          <textarea
            class="markdown-input"
            bind:value={markdownInput}
            placeholder="Paste Markdown here..."
            rows="6"
          ></textarea>
          <button type="button" class="import-button" onclick={handleImportMarkdown}>
            Import to Editor
          </button>
        </div>
      {/if}
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showMarkdown = !showMarkdown}
      >
        <span class="output-toggle-icon">{showMarkdown ? '−' : '+'}</span>
        <span>Markdown Export</span>
      </button>
      {#if showMarkdown}
        <pre class="output-content">{markdownOutput}</pre>
      {/if}
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showOutput = !showOutput}
      >
        <span class="output-toggle-icon">{showOutput ? '−' : '+'}</span>
        <span>JSON Output</span>
      </button>
      {#if showOutput}
        <pre class="output-content">{JSON.stringify(output, null, 2)}</pre>
      {/if}
    </div>
  </main>

  <footer class="footer">
    <p>
      Built with <span class="footer-highlight">@vizel/svelte</span>
    </p>
  </footer>
</div>
