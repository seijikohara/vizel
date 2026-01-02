<script setup lang="ts">
import {
  BubbleMenu,
  EditorContent,
  getEditorState,
  type JSONContent,
  SaveIndicator,
  ThemeProvider,
  useAutoSave,
  useEditorState,
  useVizelEditor,
} from "@vizel/vue";
import { computed, ref } from "vue";
import { initialContent } from "../../shared/content";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.vue";

const output = ref<JSONContent | null>(null);
const showOutput = ref(false);
const markdownOutput = ref("");
const showMarkdown = ref(false);
const markdownInput = ref("");
const showMarkdownInput = ref(false);

const editor = useVizelEditor({
  initialContent,
  autofocus: "end",
  features: {
    markdown: true,
    mathematics: true,
    embed: true,
    details: true,
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
    output.value = e.getJSON();
    markdownOutput.value = e.getMarkdown();
  },
  onCreate: ({ editor: e }) => {
    output.value = e.getJSON();
    markdownOutput.value = e.getMarkdown();
  },
});

// Track editor state for character/word count
const updateCount = useEditorState(() => editor.value);
const editorState = computed(() => {
  void updateCount.value;
  return getEditorState(editor.value);
});

// Auto-save functionality
const { status, lastSaved } = useAutoSave(() => editor.value, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-vue",
});

function handleImportMarkdown() {
  if (editor.value && markdownInput.value.trim()) {
    editor.value.commands.setContent(markdownInput.value, { contentType: "markdown" });
    markdownInput.value = "";
    showMarkdownInput.value = false;
  }
}
</script>

<template>
  <ThemeProvider defaultTheme="system" storageKey="vizel-theme">
    <div class="app">
      <header class="header">
        <div class="header-content">
          <svg class="framework-logo" viewBox="0 0 128 128">
            <path fill="currentColor" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110H78.8z" />
            <path fill="currentColor" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z" opacity="0.6" />
          </svg>
          <div class="header-text">
            <h1>Vizel Editor</h1>
            <span class="framework-badge">Vue 3</span>
          </div>
          <ThemeToggle />
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
            <span class="feature-icon">&lt;/&gt;</span>
            <span>Code Blocks</span>
          </div>
          <div class="feature-tag">
            <span class="feature-icon">∑</span>
            <span>Math (LaTeX)</span>
          </div>
          <div class="feature-tag">
            <span class="feature-icon">💾</span>
            <span>Auto-save</span>
          </div>
          <div class="feature-tag">
            <span class="feature-icon">🔗</span>
            <span>Embeds</span>
          </div>
          <div class="feature-tag">
            <span class="feature-icon">▸</span>
            <span>Details</span>
          </div>
          <div class="feature-tag">
            <span class="feature-icon">🌓</span>
            <span>Dark Mode</span>
          </div>
        </div>

        <div class="editor-container">
          <div class="editor-root">
            <EditorContent :editor="editor" class="editor-content" />
            <BubbleMenu v-if="editor" :editor="editor" enable-embed />
          </div>
          <div class="status-bar">
            <SaveIndicator :status="status" :lastSaved="lastSaved" />
            <span class="status-divider">·</span>
            <span class="status-item">{{ editorState.characterCount }} characters</span>
            <span class="status-divider">·</span>
            <span class="status-item">{{ editorState.wordCount }} words</span>
          </div>
        </div>

        <div class="output-section">
          <button
            type="button"
            class="output-toggle"
            @click="showMarkdownInput = !showMarkdownInput"
          >
            <span class="output-toggle-icon">{{ showMarkdownInput ? '−' : '+' }}</span>
            <span>Markdown Import</span>
          </button>
          <div v-if="showMarkdownInput" class="markdown-input-container">
            <textarea
              v-model="markdownInput"
              class="markdown-input"
              placeholder="Paste Markdown here..."
              rows="6"
            />
            <button type="button" class="import-button" @click="handleImportMarkdown">
              Import to Editor
            </button>
          </div>
        </div>

        <div class="output-section">
          <button
            type="button"
            class="output-toggle"
            @click="showMarkdown = !showMarkdown"
          >
            <span class="output-toggle-icon">{{ showMarkdown ? '−' : '+' }}</span>
            <span>Markdown Export</span>
          </button>
          <pre v-if="showMarkdown" class="output-content">{{ markdownOutput }}</pre>
        </div>

        <div class="output-section">
          <button
            type="button"
            class="output-toggle"
            @click="showOutput = !showOutput"
          >
            <span class="output-toggle-icon">{{ showOutput ? '−' : '+' }}</span>
            <span>JSON Output</span>
          </button>
          <pre v-if="showOutput" class="output-content">{{ JSON.stringify(output, null, 2) }}</pre>
        </div>
      </main>

      <footer class="footer">
        <p>
          Built with <span class="footer-highlight">@vizel/vue</span>
        </p>
      </footer>
    </div>
  </ThemeProvider>
</template>
