<script setup lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import { getVizelEditorState, setVizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelState,
  Vizel,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/vue";
import { computed, reactive, ref, shallowRef } from "vue";
import { initialMarkdown } from "../../shared/content";
import vueLogo from "../../shared/logos/vue.svg";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.vue";

// Feature toggles (all enabled by default)
const features = reactive({
  toolbar: true,
  theme: true,
  autoSave: true,
  stats: true,
  syncPanel: true,
});

type PanelTab = "markdown" | "json";
const activeTab = ref<PanelTab>("markdown");
const jsonInput = ref("");
const markdownInput = ref("");

// Store editor reference from Vizel component
const editorRef = shallowRef<Editor | null>(null);

// Track editor state for character/word count (only when stats enabled)
const updateCount = useVizelState(() => (features.stats ? editorRef.value : null));
const editorState = computed(() => {
  void updateCount.value;
  return features.stats
    ? getVizelEditorState(editorRef.value)
    : { characterCount: 0, wordCount: 0 };
});

// Auto-save functionality (only when autoSave enabled)
const { status, lastSaved } = useVizelAutoSave(() => (features.autoSave ? editorRef.value : null), {
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
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return;
  const value = target.value;
  markdownInput.value = value;
  if (editorRef.value) {
    setVizelMarkdown(editorRef.value, value);
  }
}

function handleJsonChange(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return;
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
          <img :src="vueLogo" alt="Vue" class="framework-logo" />
          <div class="header-text">
            <h1>Vizel Editor</h1>
            <span class="framework-badge">Vue 3</span>
          </div>
          <ThemeToggle v-if="features.theme" />
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
            <input type="checkbox" v-model="features.toolbar" />
            <span class="feature-toggle-label">Toolbar</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.theme" />
            <span class="feature-toggle-label">Theme</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.autoSave" />
            <span class="feature-toggle-label">Auto-save</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.stats" />
            <span class="feature-toggle-label">Stats</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.syncPanel" />
            <span class="feature-toggle-label">Sync Panel</span>
          </label>
        </div>
      </section>

      <main class="main">
        <div class="editor-section">
          <div class="editor-container">
            <Vizel
              :initial-markdown="initialMarkdown"
              autofocus="end"
              class="editor-content"
              :show-toolbar="features.toolbar"
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
            <div v-if="features.autoSave || features.stats" class="status-bar">
              <template v-if="features.autoSave">
                <VizelSaveIndicator :status="status" :lastSaved="lastSaved" />
                <span v-if="features.stats" class="status-divider">·</span>
              </template>
              <template v-if="features.stats">
                <span class="status-item">{{ editorState.characterCount }} characters</span>
                <span class="status-divider">·</span>
                <span class="status-item">{{ editorState.wordCount }} words</span>
              </template>
            </div>
          </div>
        </div>

        <div v-if="features.syncPanel" class="panel-section">
          <div class="panel-container">
            <div class="panel-tabs">
              <button
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'markdown'"
                @click="activeTab = 'markdown'"
              >
                Markdown
              </button>
              <button
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'json'"
                @click="activeTab = 'json'"
              >
                JSON
              </button>
            </div>
            <div class="panel-content">
              <textarea
                v-if="activeTab === 'markdown'"
                class="panel-textarea"
                :value="markdownInput"
                placeholder="Edit Markdown here..."
                @input="handleMarkdownChange"
              />
              <textarea
                v-if="activeTab === 'json'"
                class="panel-textarea"
                :value="jsonInput"
                placeholder="Edit JSON here..."
                @input="handleJsonChange"
              />
            </div>
          </div>
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
