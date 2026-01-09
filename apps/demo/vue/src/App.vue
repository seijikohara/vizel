<script setup lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelState,
  Vizel,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/vue";
import { computed, ref, shallowRef } from "vue";
import { initialMarkdown } from "../../shared/content";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.vue";

const showJson = ref(false);
const jsonInput = ref("");

const showMarkdown = ref(false);
const markdownInput = ref("");

// Store editor reference from Vizel component
const editorRef = shallowRef<Editor | null>(null);

// Track editor state for character/word count
const updateCount = useVizelState(() => editorRef.value);
const editorState = computed(() => {
  void updateCount.value;
  return getVizelEditorState(editorRef.value);
});

// Auto-save functionality
const { status, lastSaved } = useVizelAutoSave(() => editorRef.value, {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-vue",
});

function handleCreate({ editor }: { editor: Editor }) {
  editorRef.value = editor;
  jsonInput.value = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput.value = editor.getMarkdown();
}

function handleUpdate({ editor }: { editor: Editor }) {
  jsonInput.value = JSON.stringify(editor.getJSON(), null, 2);
  markdownInput.value = editor.getMarkdown();
}

function handleMarkdownChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  markdownInput.value = value;
  if (editorRef.value) {
    editorRef.value.commands.setContent(value, { contentType: "markdown" });
  }
}

function handleJsonChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  jsonInput.value = value;
  try {
    const parsed = JSON.parse(value) as JSONContent;
    if (editorRef.value) {
      editorRef.value.commands.setContent(parsed);
    }
  } catch {
    // Invalid JSON, ignore
  }
}
</script>

<template>
  <VizelThemeProvider defaultTheme="system" storageKey="vizel-theme">
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
        <div class="editor-container">
          <Vizel
            :initial-markdown="initialMarkdown"
            autofocus="end"
            class="editor-content"
            enable-embed
            :features="{
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
            }"
            @create="handleCreate"
            @update="handleUpdate"
          />
          <div class="status-bar">
            <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
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
            @click="showMarkdown = !showMarkdown"
          >
            <span class="output-toggle-icon">{{ showMarkdown ? '−' : '+' }}</span>
            <span>Markdown</span>
          </button>
          <textarea
            v-if="showMarkdown"
            class="sync-textarea"
            :value="markdownInput"
            placeholder="Edit Markdown here..."
            rows="12"
            @input="handleMarkdownChange"
          />
        </div>

        <div class="output-section">
          <button
            type="button"
            class="output-toggle"
            @click="showJson = !showJson"
          >
            <span class="output-toggle-icon">{{ showJson ? '−' : '+' }}</span>
            <span>JSON</span>
          </button>
          <textarea
            v-if="showJson"
            class="sync-textarea"
            :value="jsonInput"
            placeholder="Edit JSON here..."
            rows="12"
            @input="handleJsonChange"
          />
        </div>
      </main>

      <footer class="footer">
        <p>
          Built with <span class="footer-highlight">@vizel/vue</span>
        </p>
      </footer>
    </div>
  </VizelThemeProvider>
</template>
