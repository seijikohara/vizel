import {
  createVizelFindReplaceExtension,
  type Editor,
  type JSONContent,
  setVizelMarkdown,
  shallowEqualObject,
  useVizelAutoSave,
  useVizelComment,
  useVizelEditorState,
  useVizelThemeSafe,
  useVizelVersionHistory,
  Vizel,
  VizelFindReplace,
  type VizelMarkdownFlavor,
  VizelOutline,
  VizelProvider,
  VizelSaveIndicator,
  VizelThemeProvider,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
} from "@vizel/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getFlavorContent } from "../../shared/content";
import reactLogo from "../../shared/logos/react.svg";
import { applyDemoPreflight } from "../../shared/preflight";
import { mockMentionItems, mockUploadImage } from "../../shared/utils";

const FLAVOR_BY_NAME: Record<string, VizelMarkdownFlavor> = {
  [vizelCommonMarkFlavor.name]: vizelCommonMarkFlavor,
  [vizelGfmFlavor.name]: vizelGfmFlavor,
  [vizelObsidianFlavor.name]: vizelObsidianFlavor,
  [vizelDocusaurusFlavor.name]: vizelDocusaurusFlavor,
};

const THEME_STORAGE_KEY = "vizel-theme";

type ThemeMode = "light" | "dark" | "system";

function readStoredThemeMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

/**
 * Three-state theme toggle (light / dark / system).
 *
 * `useVizelTheme().setTheme` accepts only concrete `VizelResolvedTheme`
 * values to keep the toggle ergonomics tight; the dedicated
 * `resetToSystem()` method re-enters the "follow OS preference" mode
 * without remounting the provider.
 */
function ThemeToggle() {
  const themeApi = useVizelThemeSafe();
  const resolvedTheme = themeApi?.theme;
  const storedMode = readStoredThemeMode();

  return (
    <fieldset className="theme-toggle-group" aria-label="Theme">
      <button
        type="button"
        className="theme-toggle-option"
        data-active={storedMode === "light"}
        aria-label="Light mode"
        title="Light"
        onClick={() => themeApi?.setTheme("light")}
      >
        ☀
      </button>
      <button
        type="button"
        className="theme-toggle-option"
        data-active={storedMode === "dark"}
        aria-label="Dark mode"
        title="Dark"
        onClick={() => themeApi?.setTheme("dark")}
      >
        ☾
      </button>
      <button
        type="button"
        className="theme-toggle-option"
        data-active={storedMode === "system"}
        aria-label={`System (currently ${resolvedTheme ?? "light"})`}
        title="System"
        onClick={() => themeApi?.resetToSystem()}
      >
        ⎙
      </button>
    </fieldset>
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
  outline: boolean;
  preflight: boolean;
}

type PanelTab = "markdown" | "json" | "history" | "comments";

/**
 * Read character and word counts via the selector API.
 *
 * `useVizelEditorState` reads the editor from the surrounding
 * `VizelProvider` and re-renders only when the selector slice changes
 * (`shallowEqualObject`). The first-party reactivity primitive backs the hook.
 */
function StatsBar() {
  const stats = useVizelEditorState(
    ({ editor }) => ({
      characters: editor?.storage.characterCount?.characters() ?? 0,
      words: editor?.storage.characterCount?.words() ?? 0,
    }),
    { equalityFn: shallowEqualObject }
  );
  return (
    <>
      <span className="status-item">{stats.characters} characters</span>
      <span className="status-divider">·</span>
      <span className="status-item">{stats.words} words</span>
    </>
  );
}

function AppContent() {
  // Feature toggles (all enabled by default).
  const [features, setFeatures] = useState<DemoFeatures>({
    toolbar: true,
    theme: true,
    autoSave: true,
    stats: true,
    syncPanel: true,
    comments: true,
    history: true,
    outline: true,
    preflight: false,
  });

  const [flavorName, setFlavorName] = useState<string>(vizelGfmFlavor.name);
  const flavor = useMemo<VizelMarkdownFlavor>(
    () => FLAVOR_BY_NAME[flavorName] ?? vizelGfmFlavor,
    [flavorName]
  );
  const [activeTab, setActiveTab] = useState<PanelTab>("markdown");
  const [jsonInput, setJsonInput] = useState("");
  const [markdownInput, setMarkdownInput] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Store editor reference (useState for reactivity, unlike useRef)
  const [editor, setEditor] = useState<Editor | null>(null);

  // Auto-save functionality (only when autoSave enabled)
  const { status, lastSaved } = useVizelAutoSave(features.autoSave ? editor : null, {
    debounceMs: 2000,
    storage: "localStorage",
    key: "vizel-demo-react",
  });

  // Version History (only when history panel enabled)
  const versionHistory = useVizelVersionHistory(features.history ? editor : null, {
    key: "vizel-demo-react-versions",
    maxVersions: 20,
  });

  // Comments (only when comments panel enabled)
  const commentManager = useVizelComment(features.comments ? editor : null, {
    key: "vizel-demo-react-comments",
  });

  // Track previous flavor for content swap on change
  const prevFlavorRef = useRef(flavor);

  // Swap content when flavor changes
  useEffect(() => {
    if (flavor !== prevFlavorRef.current && editor) {
      setVizelMarkdown(editor, getFlavorContent(flavor), { transformDiagrams: true });
      prevFlavorRef.current = flavor;
    }
  }, [flavor, editor]);

  // Inject or remove a Tailwind Preflight-like host reset to exercise CSS robustness.
  useEffect(() => {
    applyDemoPreflight(features.preflight);
  }, [features.preflight]);

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
          <FeatureToggle
            label="Outline"
            checked={features.outline}
            onChange={(v) => updateFeature("outline", v)}
          />
          <FeatureToggle
            label="Preflight reset"
            checked={features.preflight}
            onChange={(v) => updateFeature("preflight", v)}
          />
          <label className="feature-toggle">
            <span className="feature-toggle-label">Flavor</span>
            <select
              className="feature-select"
              value={flavorName}
              onChange={(e) => {
                const value = e.target.value;
                if (FLAVOR_BY_NAME[value]) {
                  setFlavorName(value);
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

      <VizelProvider editor={editor}>
        <main className="main">
          {features.outline && editor && (
            <aside className="editor-aside" aria-label="Document outline">
              <div className="editor-aside-panel">
                <span className="editor-aside-title">Outline</span>
                <VizelOutline editor={editor} />
              </div>
            </aside>
          )}
          <div className="editor-section">
            <div className="editor-container">
              <Vizel
                initialMarkdown={getFlavorContent(flavor)}
                autofocus="start"
                className="editor-content"
                showToolbar={features.toolbar}
                flavor={flavor}
                enableEmbed
                extensions={findReplaceExtensions}
                features={{
                  content: {
                    mathematics: true,
                    embed: true,
                    details: true,
                    diagram: true,
                    wikiLink: true,
                    callout: true,
                    tableOfContents: true,
                    superscript: true,
                    subscript: true,
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
                  interaction: {
                    typography: true,
                    mention: { items: mockMentionItems },
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
                {/* `VizelFindReplace` lives inside the editor root so the
                  Cmd/Ctrl+F shortcut binds to the surrounding container.
                  The editor flows through the surrounding `VizelProvider`,
                  so the explicit `editor` prop can be omitted. */}
                <VizelFindReplace />
              </Vizel>
              {(features.autoSave || features.stats) && (
                <div className="status-bar">
                  {features.autoSave && (
                    <>
                      <VizelSaveIndicator status={status} lastSaved={lastSaved} />
                      {features.stats && <span className="status-divider">·</span>}
                    </>
                  )}
                  {features.stats && <StatsBar />}
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
                        <button
                          type="button"
                          className="panel-action-btn"
                          onClick={handleAddComment}
                        >
                          Add
                        </button>
                      </div>
                      {commentManager.comments.length === 0 ? (
                        <div className="panel-list-empty">No comments yet</div>
                      ) : (
                        commentManager.comments.map((comment) => (
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
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                  }))
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
      </VizelProvider>

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
