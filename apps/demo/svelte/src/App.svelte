<script lang="ts">
import { getVizelEditorState, setVizelMarkdown } from "@vizel/core";
import {
  createVizelAutoSave,
  createVizelState,
  Vizel,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/svelte";
import { initialMarkdown } from "../../shared/content";
import svelteLogo from "../../shared/logos/svelte.svg";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.svelte";

// Use local type definition to avoid version conflicts
type VizelEditor = Parameters<typeof getVizelEditorState>[0];
type JSONContent = Record<string, unknown>;

// Feature toggles (all enabled by default)
let features = $state({
  theme: true,
  autoSave: true,
  stats: true,
  syncPanel: true,
});

type PanelTab = "markdown" | "json";
let activeTab = $state<PanelTab>("markdown");
let jsonInput = $state("");
let markdownInput = $state("");

// Store editor reference from Vizel component
let editorRef: VizelEditor = $state(null);

// Track editor state for character/word count (only when stats enabled)
const updateCount = createVizelState(() => (features.stats ? editorRef : null));
const editorState = $derived.by(() => {
  void updateCount.current;
  return features.stats ? getVizelEditorState(editorRef) : { characterCount: 0, wordCount: 0 };
});

// Auto-save functionality (only when autoSave enabled)
const autoSave = createVizelAutoSave(() => (features.autoSave ? editorRef : null), {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-svelte",
});

function handleCreate({ editor }: { editor: NonNullable<VizelEditor> }) {
  editorRef = editor;
  jsonInput = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput = (editor as { getMarkdown: () => string }).getMarkdown();
}

function handleUpdate({ editor }: { editor: NonNullable<VizelEditor> }) {
  jsonInput = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput = (editor as { getMarkdown: () => string }).getMarkdown();
}

function handleMarkdownChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  markdownInput = value;
  if (editorRef) {
    setVizelMarkdown(editorRef, value);
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
      <img src={svelteLogo} alt="Svelte" class="framework-logo" />
      <div class="header-text">
        <h1>Vizel Editor</h1>
        <span class="framework-badge">Svelte 5</span>
      </div>
      {#if features.theme}
        <ThemeToggle />
      {/if}
    </div>
    <p class="header-description">
      A block-based rich text editor with slash commands and inline formatting
    </p>
  </header>

  <section class="features-section">
    <div class="features-header">
      <span class="features-title">Features</span>
      <span class="features-hint">Toggle to see minimal vs full-featured usage</span>
    </div>
    <div class="features-toggles">
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.theme} />
        <span class="feature-toggle-label">Theme</span>
      </label>
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.autoSave} />
        <span class="feature-toggle-label">Auto-save</span>
      </label>
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.stats} />
        <span class="feature-toggle-label">Stats</span>
      </label>
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.syncPanel} />
        <span class="feature-toggle-label">Sync Panel</span>
      </label>
    </div>
  </section>

  <main class="main">
    <div class="editor-section">
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
        {#if features.autoSave || features.stats}
          <div class="status-bar">
            {#if features.autoSave}
              <VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
              {#if features.stats}
                <span class="status-divider">·</span>
              {/if}
            {/if}
            {#if features.stats}
              <span class="status-item">{editorState.characterCount} characters</span>
              <span class="status-divider">·</span>
              <span class="status-item">{editorState.wordCount} words</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if features.syncPanel}
      <div class="panel-section">
        <div class="panel-container">
          <div class="panel-tabs">
            <button
              type="button"
              class="panel-tab"
              data-active={activeTab === 'markdown'}
              onclick={() => activeTab = 'markdown'}
            >
              Markdown
            </button>
            <button
              type="button"
              class="panel-tab"
              data-active={activeTab === 'json'}
              onclick={() => activeTab = 'json'}
            >
              JSON
            </button>
          </div>
          <div class="panel-content">
            {#if activeTab === 'markdown'}
              <textarea
                class="panel-textarea"
                value={markdownInput}
                placeholder="Edit Markdown here..."
                oninput={handleMarkdownChange}
              ></textarea>
            {:else if activeTab === 'json'}
              <textarea
                class="panel-textarea"
                value={jsonInput}
                placeholder="Edit JSON here..."
                oninput={handleJsonChange}
              ></textarea>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </main>

  <footer class="footer">
    <p>
      Built with <span class="footer-highlight">@vizel/svelte</span>
    </p>
  </footer>
</div>
</VizelThemeProvider>
