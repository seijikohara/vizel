import type { JSONContent } from "@tiptap/core";
import { convertVizelCodeBlocksToDiagrams, getVizelEditorState } from "@vizel/core";
import {
  useVizelAutoSave,
  useVizelState,
  useVizelTheme,
  Vizel,
  type VizelRef,
  VizelSaveIndicator,
  VizelThemeProvider,
} from "@vizel/react";
import { useRef, useState } from "react";
import { initialContent } from "../../shared/content";
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
  const [output, setOutput] = useState<JSONContent | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);

  // Store editor reference from Vizel component
  const vizelRef = useRef<VizelRef>(null);

  // Track editor state for character/word count
  useVizelState(vizelRef.current?.editor ?? null);
  const editorState = getVizelEditorState(vizelRef.current?.editor ?? null);

  // Auto-save functionality
  const { status, lastSaved } = useVizelAutoSave(vizelRef.current?.editor ?? null, {
    debounceMs: 2000,
    storage: "localStorage",
    key: "vizel-demo-react",
  });

  const handleImportMarkdown = () => {
    const editor = vizelRef.current?.editor;
    if (editor && markdownInput.trim()) {
      editor.commands.setContent(markdownInput, { contentType: "markdown" });
      // Convert diagram code blocks (mermaid, dot, graphviz) to diagram nodes after importing
      convertVizelCodeBlocksToDiagrams(editor);
      setMarkdownInput("");
      setShowMarkdownInput(false);
    }
  };

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
        <div className="features-bar">
          <div className="feature-tag">
            <span className="feature-icon">/</span>
            <span>Slash Commands</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">B</span>
            <span>Bubble Menu</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">T</span>
            <span>Tables</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">L</span>
            <span>Links</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">📎</span>
            <span>Drag & Drop</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">📋</span>
            <span>Paste Images</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">M</span>
            <span>Markdown</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">#</span>
            <span>Character Count</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">{"</>"}</span>
            <span>Code Blocks</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">∑</span>
            <span>Math (LaTeX)</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">💾</span>
            <span>Auto-save</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">🔗</span>
            <span>Embeds</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">▸</span>
            <span>Details</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">📊</span>
            <span>Diagrams</span>
          </div>
          <div className="feature-tag">
            <span className="feature-icon">🌓</span>
            <span>Dark Mode</span>
          </div>
        </div>

        <div className="editor-container">
          <Vizel
            ref={vizelRef}
            initialContent={initialContent}
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
              setOutput(editor.getJSON() as JSONContent);
              setMarkdownOutput(editor.getMarkdown());
            }}
            onUpdate={({ editor }) => {
              setOutput(editor.getJSON() as JSONContent);
              setMarkdownOutput(editor.getMarkdown());
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
            onClick={() => setShowMarkdownInput(!showMarkdownInput)}
          >
            <span className="output-toggle-icon">{showMarkdownInput ? "−" : "+"}</span>
            <span>Markdown Import</span>
          </button>
          {showMarkdownInput && (
            <div className="markdown-input-container">
              <textarea
                className="markdown-input"
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                placeholder="Paste Markdown here..."
                rows={6}
              />
              <button type="button" className="import-button" onClick={handleImportMarkdown}>
                Import to Editor
              </button>
            </div>
          )}
        </div>

        <div className="output-section">
          <button
            type="button"
            className="output-toggle"
            onClick={() => setShowMarkdown(!showMarkdown)}
          >
            <span className="output-toggle-icon">{showMarkdown ? "−" : "+"}</span>
            <span>Markdown Export</span>
          </button>
          {showMarkdown && <pre className="output-content">{markdownOutput}</pre>}
        </div>

        <div className="output-section">
          <button
            type="button"
            className="output-toggle"
            onClick={() => setShowOutput(!showOutput)}
          >
            <span className="output-toggle-icon">{showOutput ? "−" : "+"}</span>
            <span>JSON Output</span>
          </button>
          {showOutput && <pre className="output-content">{JSON.stringify(output, null, 2)}</pre>}
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
