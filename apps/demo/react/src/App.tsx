import type { Editor, JSONContent } from "@tiptap/core";
import { setVizelMarkdown } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelEditorState,
  useVizelTheme,
  Vizel,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/react";
import { useCallback, useState } from "react";
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
  theme: boolean;
  autoSave: boolean;
  stats: boolean;
  syncPanel: boolean;
}

type PanelTab = "markdown" | "json";

function AppContent() {
  // Feature toggles (all enabled by default)
  const [features, setFeatures] = useState<DemoFeatures>({
    theme: true,
    autoSave: true,
    stats: true,
    syncPanel: true,
  });

  const [activeTab, setActiveTab] = useState<PanelTab>("markdown");
  const [jsonInput, setJsonInput] = useState("");
  const [markdownInput, setMarkdownInput] = useState("");

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

  function updateFeature(key: keyof DemoFeatures, value: boolean) {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  }

  const showPanel = features.syncPanel;

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
        </div>
      </section>

      <main className="main">
        <div className="editor-section">
          <div className="editor-container">
            <Vizel
              initialMarkdown={initialMarkdown}
              autofocus="end"
              className="editor-content"
              enableEmbed
              features={{
                markdown: true,
                mathematics: true,
                embed: true,
                details: true,
                diagram: true,
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
                const json = newEditor.getJSON() as JSONContent;
                setJsonInput(JSON.stringify(json, null, 2));
                setMarkdownInput(newEditor.getMarkdown());
              }}
              onUpdate={({ editor: updatedEditor }) => {
                const json = updatedEditor.getJSON() as JSONContent;
                setJsonInput(JSON.stringify(json, null, 2));
                setMarkdownInput(updatedEditor.getMarkdown());
              }}
            />
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
                <button
                  type="button"
                  className="panel-tab"
                  data-active={activeTab === "markdown"}
                  onClick={() => setActiveTab("markdown")}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  className="panel-tab"
                  data-active={activeTab === "json"}
                  onClick={() => setActiveTab("json")}
                >
                  JSON
                </button>
              </div>
              <div className="panel-content">
                {activeTab === "markdown" && (
                  <textarea
                    className="panel-textarea"
                    value={markdownInput}
                    onChange={(e) => handleMarkdownChange(e.target.value)}
                    placeholder="Edit Markdown here..."
                  />
                )}
                {activeTab === "json" && (
                  <textarea
                    className="panel-textarea"
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Edit JSON here..."
                  />
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
