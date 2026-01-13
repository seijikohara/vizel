import type { JSONContent } from "@tiptap/core";
import { getVizelEditorState } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelState,
  useVizelTheme,
  Vizel,
  type VizelRef,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/react";
import { useCallback, useRef, useState } from "react";
import { initialMarkdown } from "../../shared/content";
import { mockUploadImage } from "../../shared/utils";

function ReactLogo() {
  return (
    <svg viewBox="-11.5 -10.23174 23 20.46348" className="framework-logo">
      <circle cx="0" cy="0" r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

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

function AppContent() {
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");

  // Store editor reference from Vizel component
  const vizelRef = useRef<VizelRef>(null);

  // Track editor state for character/word count
  useVizelState(() => vizelRef.current?.editor ?? null);
  const editorState = getVizelEditorState(vizelRef.current?.editor ?? null);

  // Auto-save functionality
  const { status, lastSaved } = useVizelAutoSave(() => vizelRef.current?.editor ?? null, {
    debounceMs: 2000,
    storage: "localStorage",
    key: "vizel-demo-react",
  });

  // Handle Markdown input change and sync to editor
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownInput(value);
    const editor = vizelRef.current?.editor;
    if (editor) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
  }, []);

  // Handle JSON input change and sync to editor
  const handleJsonChange = useCallback((value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value) as JSONContent;
      const editor = vizelRef.current?.editor;
      if (editor) {
        editor.commands.setContent(parsed);
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <ReactLogo />
          <div className="header-text">
            <h1>Vizel Editor</h1>
            <span className="framework-badge">React 19</span>
          </div>
          <ThemeToggle />
        </div>
        <p className="header-description">
          A block-based rich text editor with slash commands and inline formatting
        </p>
      </header>

      <main className="main">
        <div className="editor-container">
          <Vizel
            ref={vizelRef}
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
            onCreate={({ editor }) => {
              const json = editor.getJSON() as JSONContent;
              setJsonInput(JSON.stringify(json, null, 2));
              setMarkdownInput(editor.getMarkdown());
            }}
            onUpdate={({ editor }) => {
              const json = editor.getJSON() as JSONContent;
              setJsonInput(JSON.stringify(json, null, 2));
              setMarkdownInput(editor.getMarkdown());
            }}
          />
          <div className="status-bar">
            <VizelSaveIndicator status={status} lastSaved={lastSaved} />
            <span className="status-divider">·</span>
            <span className="status-item">{editorState.characterCount} characters</span>
            <span className="status-divider">·</span>
            <span className="status-item">{editorState.wordCount} words</span>
          </div>
        </div>

        <div className="output-section">
          <button
            type="button"
            className="output-toggle"
            onClick={() => setShowMarkdown(!showMarkdown)}
          >
            <span className="output-toggle-icon">{showMarkdown ? "−" : "+"}</span>
            <span>Markdown</span>
          </button>
          {showMarkdown && (
            <textarea
              className="sync-textarea"
              value={markdownInput}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder="Edit Markdown here..."
              rows={12}
            />
          )}
        </div>

        <div className="output-section">
          <button type="button" className="output-toggle" onClick={() => setShowJson(!showJson)}>
            <span className="output-toggle-icon">{showJson ? "−" : "+"}</span>
            <span>JSON</span>
          </button>
          {showJson && (
            <textarea
              className="sync-textarea"
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Edit JSON here..."
              rows={12}
            />
          )}
        </div>
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
