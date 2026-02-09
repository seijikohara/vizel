<script setup lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import { createVizelFindReplaceExtension, setVizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelComment,
  useVizelEditorState,
  useVizelVersionHistory,
  Vizel,
  VizelFindReplace,
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
  comments: false,
  history: false,
});

type PanelTab = "markdown" | "json" | "history" | "comments";
const activeTab = ref<PanelTab>("markdown");
const jsonInput = ref("");
const markdownInput = ref("");
const versionDescription = ref("");
const commentText = ref("");
const replyTexts = ref<Record<string, string>>({});

// Store editor reference from Vizel component
const editorRef = shallowRef<Editor | null>(null);

// Track editor state for character/word count (only when stats enabled)
const editorState = useVizelEditorState(() => (features.stats ? editorRef.value : null));

// Auto-save functionality (only when autoSave enabled)
const { status, lastSaved } = useVizelAutoSave(() => (features.autoSave ? editorRef.value : null), {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-vue",
});

// Version History (only when history panel enabled)
const versionHistory = useVizelVersionHistory(() => (features.history ? editorRef.value : null), {
  key: "vizel-demo-vue-versions",
  maxVersions: 20,
});

// Comments (only when comments panel enabled)
const commentManager = useVizelComment(() => (features.comments ? editorRef.value : null), {
  key: "vizel-demo-vue-comments",
});

// Find & Replace extension
const findReplaceExtensions = [createVizelFindReplaceExtension()];

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

async function handleSaveVersion() {
  if (!versionDescription.value.trim()) return;
  await versionHistory.saveVersion(versionDescription.value.trim());
  versionDescription.value = "";
}

async function handleAddComment() {
  if (!commentText.value.trim()) return;
  await commentManager.addComment(commentText.value.trim(), "Demo User");
  commentText.value = "";
}

async function handleReply(commentId: string) {
  const text = replyTexts.value[commentId]?.trim();
  if (!text) return;
  await commentManager.replyToComment(commentId, text, "Demo User");
  replyTexts.value = { ...replyTexts.value, [commentId]: "" };
}

const showPanel = computed(() => features.syncPanel || features.history || features.comments);
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
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.comments" />
            <span class="feature-toggle-label">Comments</span>
          </label>
          <label class="feature-toggle">
            <input type="checkbox" v-model="features.history" />
            <span class="feature-toggle-label">History</span>
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
              :extensions="findReplaceExtensions"
              :features="{
                markdown: true,
                mathematics: true,
                embed: true,
                details: true,
                diagram: true,
                wikiLink: true,
                comment: true,
                image: {
                  onUpload: mockUploadImage,
                  maxFileSize: 10 * 1024 * 1024,
                  onValidationError: (error) => alert(`Validation error: ${error.message}`),
                  onUploadError: (error) => alert(`Upload failed: ${error.message}`),
                },
              }"
              @create="handleCreate"
              @update="handleUpdate"
            >
              <template #default="{ editor: slotEditor }">
                <VizelFindReplace v-if="slotEditor" :editor="slotEditor" />
              </template>
            </Vizel>
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

        <div v-if="showPanel" class="panel-section">
          <div class="panel-container">
            <div class="panel-tabs">
              <button
                v-if="features.syncPanel"
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'markdown'"
                @click="activeTab = 'markdown'"
              >
                Markdown
              </button>
              <button
                v-if="features.syncPanel"
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'json'"
                @click="activeTab = 'json'"
              >
                JSON
              </button>
              <button
                v-if="features.history"
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'history'"
                @click="activeTab = 'history'"
              >
                History
              </button>
              <button
                v-if="features.comments"
                type="button"
                class="panel-tab"
                :data-active="activeTab === 'comments'"
                @click="activeTab = 'comments'"
              >
                Comments
              </button>
            </div>
            <div class="panel-content">
              <textarea
                v-if="activeTab === 'markdown' && features.syncPanel"
                class="panel-textarea"
                :value="markdownInput"
                placeholder="Edit Markdown here..."
                @input="handleMarkdownChange"
              />
              <textarea
                v-if="activeTab === 'json' && features.syncPanel"
                class="panel-textarea"
                :value="jsonInput"
                placeholder="Edit JSON here..."
                @input="handleJsonChange"
              />

              <!-- Version History -->
              <template v-if="activeTab === 'history'">
                <div class="panel-list">
                  <div class="panel-action-bar">
                    <input
                      type="text"
                      placeholder="Version description..."
                      v-model="versionDescription"
                      @keydown.enter="handleSaveVersion"
                    />
                    <button type="button" class="panel-action-btn" @click="handleSaveVersion">
                      Save
                    </button>
                  </div>
                  <div v-if="versionHistory.snapshots.value.length === 0" class="panel-list-empty">
                    No versions saved yet
                  </div>
                  <div
                    v-for="snapshot in versionHistory.snapshots.value"
                    :key="snapshot.id"
                    class="panel-item"
                  >
                    <div class="panel-item-header">
                      <span class="panel-item-text">{{ snapshot.description || "Untitled" }}</span>
                      <span class="panel-item-meta">
                        {{ new Date(snapshot.timestamp).toLocaleString() }}
                      </span>
                    </div>
                    <div class="panel-item-actions">
                      <button type="button" class="panel-item-btn" @click="versionHistory.restoreVersion(snapshot.id)">
                        Restore
                      </button>
                      <button type="button" class="panel-item-btn panel-item-btn--danger" @click="versionHistory.deleteVersion(snapshot.id)">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Comments -->
              <template v-if="activeTab === 'comments'">
                <div class="panel-list">
                  <div class="panel-action-bar">
                    <input
                      type="text"
                      placeholder="Select text, then add a comment..."
                      v-model="commentText"
                      @keydown.enter="handleAddComment"
                    />
                    <button type="button" class="panel-action-btn" @click="handleAddComment">
                      Add
                    </button>
                  </div>
                  <div v-if="commentManager.comments.value.length === 0" class="panel-list-empty">
                    No comments yet
                  </div>
                  <div
                    v-for="comment in commentManager.comments.value"
                    :key="comment.id"
                    :class="['panel-item', comment.resolved ? 'panel-item-resolved' : '']"
                    role="button"
                    tabindex="0"
                    @click="commentManager.setActiveComment(comment.id)"
                    @keydown.enter="commentManager.setActiveComment(comment.id)"
                  >
                    <div class="panel-item-header">
                      <span class="panel-item-text">{{ comment.text }}</span>
                      <span class="panel-item-meta">
                        {{ comment.author ? comment.author + ' · ' : '' }}{{ new Date(comment.createdAt).toLocaleString() }}
                      </span>
                    </div>
                    <div class="panel-item-actions">
                      <button
                        v-if="comment.resolved"
                        type="button"
                        class="panel-item-btn"
                        @click.stop="commentManager.reopenComment(comment.id)"
                      >
                        Reopen
                      </button>
                      <button
                        v-else
                        type="button"
                        class="panel-item-btn"
                        @click.stop="commentManager.resolveComment(comment.id)"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        class="panel-item-btn panel-item-btn--danger"
                        @click.stop="commentManager.removeComment(comment.id)"
                      >
                        Remove
                      </button>
                    </div>
                    <div v-if="comment.replies.length > 0" class="panel-replies">
                      <div v-for="reply in comment.replies" :key="reply.id" class="panel-reply">
                        <span class="panel-reply-meta">
                          {{ reply.author ? reply.author + ' · ' : '' }}{{ new Date(reply.createdAt).toLocaleString() }}
                        </span>
                        <div>{{ reply.text }}</div>
                      </div>
                    </div>
                    <div class="panel-reply-input" @click.stop>
                      <input
                        placeholder="Reply..."
                        :value="replyTexts[comment.id] || ''"
                        @input="(e) => { replyTexts = { ...replyTexts, [comment.id]: (e.target as HTMLInputElement).value } }"
                        @keydown.enter="handleReply(comment.id)"
                      />
                      <button type="button" @click="handleReply(comment.id)">Reply</button>
                    </div>
                  </div>
                </div>
              </template>
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
