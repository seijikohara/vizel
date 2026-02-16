import type { Editor, JSONContent } from "@tiptap/core";
import type { VizelMarkdownFlavor } from "@vizel/core";
import { createVizelFindReplaceExtension, setVizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelComment,
  useVizelEditorState,
  useVizelTheme,
  useVizelVersionHistory,
  Vizel,
  VizelFindReplace,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/react";
import { useCallback, useMemo, useState } from "react";
import { initialMarkdown } from "../../shared/content";
import reactLogo from "../../shared/logos/react.svg";
import { mockUploadImage } from "../../shared/utils";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useVizelTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureToggle({ label, checked, onChange }: FeatureToggleProps) {
  return (
    <label className="feature-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="feature-toggle-label">{label}</span>
    </label>
  );
}

interface DemoFeatures {
  toolbar: boolean;
  theme: boolean;
  autoSave: boolean;
  stats: boolean;
  syncPanel: boolean;
  comments: boolean;
  history: boolean;
}

type PanelTab = "markdown" | "json" | "history" | "comments";

function AppContent() {
  // Feature toggles (all enabled by default)
  const [features, setFeatures] = useState<DemoFeatures>({
    toolbar: true,
    theme: true,
    autoSave: true,
    stats: true,
    syncPanel: true,
    comments: false,
    history: false,
  });

  const [flavor, setFlavor] = useState<VizelMarkdownFlavor>("gfm");
  const [activeTab, setActiveTab] = useState<PanelTab>("markdown");
  const [jsonInput, setJsonInput] = useState("");
  const [markdownInput, setMarkdownInput] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Store editor reference (useState for reactivity, unlike useRef)
  const [editor, setEditor] = useState<Editor | null>(null);

  // Track editor state for character/word count (only when stats enabled)
  const editorState = useVizelEditorState(() => (features.stats ? editor : null));

  // Auto-save functionality (only when autoSave enabled)
  const { status, lastSaved } = useVizelAutoSave(() => (features.autoSave ? editor : null), {
    debounceMs: 2000,
    storage: "localStorage",
    key: "vizel-demo-react",
  });

  // Version History (only when history panel enabled)
  const versionHistory = useVizelVersionHistory(() => (features.history ? editor : null), {
    key: "vizel-demo-react-versions",
    maxVersions: 20,
  });

  // Comments (only when comments panel enabled)
  const commentManager = useVizelComment(() => (features.comments ? editor : null), {
    key: "vizel-demo-react-comments",
  });

  // Find & Replace extension (stable reference)
  const findReplaceExtensions = useMemo(() => [createVizelFindReplaceExtension()], []);

  // Handle Markdown input change and sync to editor
  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdownInput(value);
      if (editor) {
        setVizelMarkdown(editor, value);
      }
    },
    [editor]
  );

  // Handle JSON input change and sync to editor
  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonInput(value);
      try {
        const parsed = JSON.parse(value) as JSONContent;
        if (editor) {
          editor.commands.setContent(parsed);
        }
      } catch {
        // Invalid JSON, ignore
      }
    },
    [editor]
  );

  async function handleSaveVersion() {
    if (!versionDescription.trim()) return;
    await versionHistory.saveVersion(versionDescription.trim());
    setVersionDescription("");
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    await commentManager.addComment(commentText.trim(), "Demo User");
    setCommentText("");
  }

  async function handleReply(commentId: string) {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    await commentManager.replyToComment(commentId, text, "Demo User");
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
  }

  function updateFeature(key: keyof DemoFeatures, value: boolean) {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  }

  const showPanel = features.syncPanel || features.history || features.comments;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <img src={reactLogo} alt="React" className="framework-logo" />
          <div className="header-text">
            <h1>Vizel Editor</h1>
            <span className="framework-badge">React 19</span>
          </div>
          {features.theme && <ThemeToggle />}
        </div>
        <p className="header-description">
          A block-based rich text editor with slash commands and inline formatting
        </p>
      </header>

      <section className="features-section">
        <div className="features-header">
          <span className="features-title">Features</span>
          <span className="features-hint">Toggle to see minimal vs full-featured usage</span>
        </div>
        <div className="features-toggles">
          <FeatureToggle
            label="Toolbar"
            checked={features.toolbar}
            onChange={(v) => updateFeature("toolbar", v)}
          />
          <FeatureToggle
            label="Theme"
            checked={features.theme}
            onChange={(v) => updateFeature("theme", v)}
          />
          <FeatureToggle
            label="Auto-save"
            checked={features.autoSave}
            onChange={(v) => updateFeature("autoSave", v)}
          />
          <FeatureToggle
            label="Stats"
            checked={features.stats}
            onChange={(v) => updateFeature("stats", v)}
          />
          <FeatureToggle
            label="Sync Panel"
            checked={features.syncPanel}
            onChange={(v) => updateFeature("syncPanel", v)}
          />
          <FeatureToggle
            label="Comments"
            checked={features.comments}
            onChange={(v) => updateFeature("comments", v)}
          />
          <FeatureToggle
            label="History"
            checked={features.history}
            onChange={(v) => updateFeature("history", v)}
          />
          <label className="feature-toggle">
            <span className="feature-toggle-label">Flavor</span>
            <select
              className="feature-select"
              value={flavor}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "commonmark" ||
                  value === "gfm" ||
                  value === "obsidian" ||
                  value === "docusaurus"
                ) {
                  setFlavor(value);
                }
              }}
            >
              <option value="commonmark">CommonMark</option>
              <option value="gfm">GFM</option>
              <option value="obsidian">Obsidian</option>
              <option value="docusaurus">Docusaurus</option>
            </select>
          </label>
        </div>
      </section>

      <main className="main">
        <div className="editor-section">
          <div className="editor-container">
            <Vizel
              initialMarkdown={initialMarkdown}
              autofocus="end"
              className="editor-content"
              showToolbar={features.toolbar}
              flavor={flavor}
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
                  maxFileSize: 10 * 1024 * 1024, // 10MB
                  onValidationError: (error) => {
                    alert(`Validation error: ${error.message}`);
                  },
                  onUploadError: (error) => {
                    alert(`Upload failed: ${error.message}`);
                  },
                },
              }}
              onCreate={({ editor: newEditor }) => {
                setEditor(newEditor);
                const json = newEditor.getJSON();
                setJsonInput(JSON.stringify(json, null, 2));
                setMarkdownInput(newEditor.getMarkdown());
              }}
              onUpdate={({ editor: updatedEditor }) => {
                const json = updatedEditor.getJSON();
                setJsonInput(JSON.stringify(json, null, 2));
                setMarkdownInput(updatedEditor.getMarkdown());
              }}
            >
              <VizelFindReplace editor={editor} />
            </Vizel>
            {(features.autoSave || features.stats) && (
              <div className="status-bar">
                {features.autoSave && (
                  <>
                    <VizelSaveIndicator status={status} lastSaved={lastSaved} />
                    {features.stats && <span className="status-divider">·</span>}
                  </>
                )}
                {features.stats && (
                  <>
                    <span className="status-item">{editorState.characterCount} characters</span>
                    <span className="status-divider">·</span>
                    <span className="status-item">{editorState.wordCount} words</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {showPanel && (
          <div className="panel-section">
            <div className="panel-container">
              <div className="panel-tabs">
                {features.syncPanel && (
                  <button
                    type="button"
                    className="panel-tab"
                    data-active={activeTab === "markdown"}
                    onClick={() => setActiveTab("markdown")}
                  >
                    Markdown
                  </button>
                )}
                {features.syncPanel && (
                  <button
                    type="button"
                    className="panel-tab"
                    data-active={activeTab === "json"}
                    onClick={() => setActiveTab("json")}
                  >
                    JSON
                  </button>
                )}
                {features.history && (
                  <button
                    type="button"
                    className="panel-tab"
                    data-active={activeTab === "history"}
                    onClick={() => setActiveTab("history")}
                  >
                    History
                  </button>
                )}
                {features.comments && (
                  <button
                    type="button"
                    className="panel-tab"
                    data-active={activeTab === "comments"}
                    onClick={() => setActiveTab("comments")}
                  >
                    Comments
                  </button>
                )}
              </div>
              <div className="panel-content">
                {activeTab === "markdown" && features.syncPanel && (
                  <textarea
                    className="panel-textarea"
                    value={markdownInput}
                    onChange={(e) => handleMarkdownChange(e.target.value)}
                    placeholder="Edit Markdown here..."
                  />
                )}
                {activeTab === "json" && features.syncPanel && (
                  <textarea
                    className="panel-textarea"
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Edit JSON here..."
                  />
                )}
                {activeTab === "history" && (
                  <div className="panel-list">
                    <div className="panel-action-bar">
                      <input
                        type="text"
                        placeholder="Version description..."
                        value={versionDescription}
                        onChange={(e) => setVersionDescription(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
                      />
                      <button
                        type="button"
                        className="panel-action-btn"
                        onClick={handleSaveVersion}
                      >
                        Save
                      </button>
                    </div>
                    {versionHistory.snapshots.length === 0 ? (
                      <div className="panel-list-empty">No versions saved yet</div>
                    ) : (
                      versionHistory.snapshots.map((snapshot) => (
                        <div key={snapshot.id} className="panel-item">
                          <div className="panel-item-header">
                            <span className="panel-item-text">
                              {snapshot.description || "Untitled"}
                            </span>
                            <span className="panel-item-meta">
                              {new Date(snapshot.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="panel-item-actions">
                            <button
                              type="button"
                              className="panel-item-btn"
                              onClick={() => versionHistory.restoreVersion(snapshot.id)}
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              className="panel-item-btn panel-item-btn--danger"
                              onClick={() => versionHistory.deleteVersion(snapshot.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "comments" && (
                  <div className="panel-list">
                    <div className="panel-action-bar">
                      <input
                        type="text"
                        placeholder="Select text, then add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      />
                      <button type="button" className="panel-action-btn" onClick={handleAddComment}>
                        Add
                      </button>
                    </div>
                    {commentManager.comments.length === 0 ? (
                      <div className="panel-list-empty">No comments yet</div>
                    ) : (
                      commentManager.comments.map((comment) => (
                        // biome-ignore lint/a11y/useSemanticElements: Card contains nested interactive elements
                        <div
                          key={comment.id}
                          className={`panel-item ${comment.resolved ? "panel-item-resolved" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => commentManager.setActiveComment(comment.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && commentManager.setActiveComment(comment.id)
                          }
                        >
                          <div className="panel-item-header">
                            <span className="panel-item-text">{comment.text}</span>
                            <span className="panel-item-meta">
                              {comment.author && `${comment.author} · `}
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="panel-item-actions">
                            {comment.resolved ? (
                              <button
                                type="button"
                                className="panel-item-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  commentManager.reopenComment(comment.id);
                                }}
                              >
                                Reopen
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="panel-item-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  commentManager.resolveComment(comment.id);
                                }}
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              type="button"
                              className="panel-item-btn panel-item-btn--danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                commentManager.removeComment(comment.id);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          {comment.replies.length > 0 && (
                            <div className="panel-replies">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="panel-reply">
                                  <span className="panel-reply-meta">
                                    {reply.author && `${reply.author} · `}
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                  <div>{reply.text}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="panel-reply-input">
                            <input
                              placeholder="Reply..."
                              value={replyTexts[comment.id] || ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                              }
                              onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(comment.id);
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          Built with <span className="footer-highlight">@vizel/react</span>
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <VizelThemeProvider defaultTheme="system" storageKey="vizel-theme">
      <AppContent />
    </VizelThemeProvider>
  );
}
