<script lang="ts">
import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelMarkdownFlavor } from "@vizel/core";
import { createVizelFindReplaceExtension, setVizelMarkdown } from "@vizel/core";
import {
  createVizelAutoSave,
  createVizelComment,
  createVizelEditorState,
  createVizelVersionHistory,
  Vizel,
  VizelFindReplace,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/svelte";
import { initialMarkdown } from "../../shared/content";
import svelteLogo from "../../shared/logos/svelte.svg";
import { mockUploadImage } from "../../shared/utils";
import ThemeToggle from "./ThemeToggle.svelte";

// Feature toggles (all enabled by default)
let features = $state({
  toolbar: true,
  theme: true,
  autoSave: true,
  stats: true,
  syncPanel: true,
  comments: false,
  history: false,
});

let flavor = $state<VizelMarkdownFlavor>("gfm");

type PanelTab = "markdown" | "json" | "history" | "comments";
let activeTab = $state<PanelTab>("markdown");
let jsonInput = $state("");
let markdownInput = $state("");
let versionDescription = $state("");
let commentText = $state("");
let replyTexts = $state<Record<string, string>>({});

// Store editor reference from Vizel component
let editorRef: Editor | null = $state(null);

// Track editor state for character/word count (only when stats enabled)
const editorState = createVizelEditorState(() => (features.stats ? editorRef : null));

// Auto-save functionality (only when autoSave enabled)
const autoSave = createVizelAutoSave(() => (features.autoSave ? editorRef : null), {
  debounceMs: 2000,
  storage: "localStorage",
  key: "vizel-demo-svelte",
});

// Version History (only when history panel enabled)
const versionHistory = createVizelVersionHistory(() => (features.history ? editorRef : null), {
  key: "vizel-demo-svelte-versions",
  maxVersions: 20,
});

// Comments (only when comments panel enabled)
const commentManager = createVizelComment(() => (features.comments ? editorRef : null), {
  key: "vizel-demo-svelte-comments",
});

// Find & Replace extension
const findReplaceExtensions = [createVizelFindReplaceExtension()];

const showPanel = $derived(features.syncPanel || features.history || features.comments);

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
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return;
  const value = target.value;
  markdownInput = value;
  if (editorRef) {
    setVizelMarkdown(editorRef, value);
  }
}

async function handleSaveVersion() {
  if (!versionDescription.trim()) return;
  await versionHistory.saveVersion(versionDescription.trim());
  versionDescription = "";
}

async function handleAddComment() {
  if (!commentText.trim()) return;
  await commentManager.addComment(commentText.trim(), "Demo User");
  commentText = "";
}

async function handleReply(commentId: string) {
  const text = replyTexts[commentId]?.trim();
  if (!text) return;
  await commentManager.replyToComment(commentId, text, "Demo User");
  replyTexts = { ...replyTexts, [commentId]: "" };
}

function handleJsonChange(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return;
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
        <input type="checkbox" bind:checked={features.toolbar} />
        <span class="feature-toggle-label">Toolbar</span>
      </label>
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
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.comments} />
        <span class="feature-toggle-label">Comments</span>
      </label>
      <label class="feature-toggle">
        <input type="checkbox" bind:checked={features.history} />
        <span class="feature-toggle-label">History</span>
      </label>
      <label class="feature-toggle">
        <span class="feature-toggle-label">Flavor</span>
        <select
          class="feature-select"
          bind:value={flavor}
        >
          <option value="commonmark">CommonMark</option>
          <option value="gfm">GFM</option>
          <option value="obsidian">Obsidian</option>
          <option value="docusaurus">Docusaurus</option>
        </select>
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
          showToolbar={features.toolbar}
          {flavor}
          enableEmbed
          extensions={findReplaceExtensions}
          features={{
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
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        >
          {#snippet children({ editor: snippetEditor })}
            {#if snippetEditor}
              <VizelFindReplace editor={snippetEditor} />
            {/if}
          {/snippet}
        </Vizel>
        {#if features.autoSave || features.stats}
          <div class="status-bar">
            {#if features.autoSave}
              <VizelSaveIndicator status={autoSave.status} lastSaved={autoSave.lastSaved} />
              {#if features.stats}
                <span class="status-divider">·</span>
              {/if}
            {/if}
            {#if features.stats}
              <span class="status-item">{editorState.current.characterCount} characters</span>
              <span class="status-divider">·</span>
              <span class="status-item">{editorState.current.wordCount} words</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if showPanel}
      <div class="panel-section">
        <div class="panel-container">
          <div class="panel-tabs">
            {#if features.syncPanel}
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
            {/if}
            {#if features.history}
              <button
                type="button"
                class="panel-tab"
                data-active={activeTab === 'history'}
                onclick={() => activeTab = 'history'}
              >
                History
              </button>
            {/if}
            {#if features.comments}
              <button
                type="button"
                class="panel-tab"
                data-active={activeTab === 'comments'}
                onclick={() => activeTab = 'comments'}
              >
                Comments
              </button>
            {/if}
          </div>
          <div class="panel-content">
            {#if activeTab === 'markdown' && features.syncPanel}
              <textarea
                class="panel-textarea"
                value={markdownInput}
                placeholder="Edit Markdown here..."
                oninput={handleMarkdownChange}
              ></textarea>
            {:else if activeTab === 'json' && features.syncPanel}
              <textarea
                class="panel-textarea"
                value={jsonInput}
                placeholder="Edit JSON here..."
                oninput={handleJsonChange}
              ></textarea>
            {:else if activeTab === 'history'}
              <div class="panel-list">
                <div class="panel-action-bar">
                  <input
                    type="text"
                    placeholder="Version description..."
                    bind:value={versionDescription}
                    onkeydown={(e) => e.key === 'Enter' && handleSaveVersion()}
                  />
                  <button type="button" class="panel-action-btn" onclick={handleSaveVersion}>
                    Save
                  </button>
                </div>
                {#if versionHistory.snapshots.length === 0}
                  <div class="panel-list-empty">No versions saved yet</div>
                {:else}
                  {#each versionHistory.snapshots as snapshot (snapshot.id)}
                    <div class="panel-item">
                      <div class="panel-item-header">
                        <span class="panel-item-text">{snapshot.description || "Untitled"}</span>
                        <span class="panel-item-meta">
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div class="panel-item-actions">
                        <button type="button" class="panel-item-btn" onclick={() => versionHistory.restoreVersion(snapshot.id)}>
                          Restore
                        </button>
                        <button type="button" class="panel-item-btn panel-item-btn--danger" onclick={() => versionHistory.deleteVersion(snapshot.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            {:else if activeTab === 'comments'}
              <div class="panel-list">
                <div class="panel-action-bar">
                  <input
                    type="text"
                    placeholder="Select text, then add a comment..."
                    bind:value={commentText}
                    onkeydown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button type="button" class="panel-action-btn" onclick={handleAddComment}>
                    Add
                  </button>
                </div>
                {#if commentManager.comments.length === 0}
                  <div class="panel-list-empty">No comments yet</div>
                {:else}
                  {#each commentManager.comments as comment (comment.id)}
                    <div
                      class="panel-item {comment.resolved ? 'panel-item-resolved' : ''}"
                      onclick={() => commentManager.setActiveComment(comment.id)}
                      onkeydown={(e) => e.key === 'Enter' && commentManager.setActiveComment(comment.id)}
                      role="button"
                      tabindex="0"
                    >
                      <div class="panel-item-header">
                        <span class="panel-item-text">{comment.text}</span>
                        <span class="panel-item-meta">
                          {comment.author ? comment.author + ' · ' : ''}{new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div class="panel-item-actions">
                        {#if comment.resolved}
                          <button type="button" class="panel-item-btn" onclick={(e) => { e.stopPropagation(); commentManager.reopenComment(comment.id); }}>
                            Reopen
                          </button>
                        {:else}
                          <button type="button" class="panel-item-btn" onclick={(e) => { e.stopPropagation(); commentManager.resolveComment(comment.id); }}>
                            Resolve
                          </button>
                        {/if}
                        <button type="button" class="panel-item-btn panel-item-btn--danger" onclick={(e) => { e.stopPropagation(); commentManager.removeComment(comment.id); }}>
                          Remove
                        </button>
                      </div>
                      {#if comment.replies.length > 0}
                        <div class="panel-replies">
                          {#each comment.replies as reply (reply.id)}
                            <div class="panel-reply">
                              <span class="panel-reply-meta">
                                {reply.author ? reply.author + ' · ' : ''}{new Date(reply.createdAt).toLocaleString()}
                              </span>
                              <div>{reply.text}</div>
                            </div>
                          {/each}
                        </div>
                      {/if}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <div class="panel-reply-input" onclick={(e) => e.stopPropagation()}>
                        <input
                          placeholder="Reply..."
                          value={replyTexts[comment.id] || ""}
                          oninput={(e) => { replyTexts = { ...replyTexts, [comment.id]: (e.target as HTMLInputElement).value }; }}
                          onkeydown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                        />
                        <button type="button" onclick={() => handleReply(comment.id)}>Reply</button>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
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
