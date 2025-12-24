import {
  BubbleMenu,
  createImageExtension,
  createLinkExtension,
  createSlashMenuRenderer,
  createTableExtensions,
  defaultSlashCommands,
  type JSONContent,
  Placeholder,
  SlashCommand,
  StarterKit,
  TiptapEditorContent,
  useEditor,
} from "@vizel/react";
import { useCallback, useState } from "react";

const initialContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Vizel Editor" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a " },
        { type: "text", marks: [{ type: "bold" }], text: "Notion-style" },
        { type: "text", text: " visual editor built with " },
        { type: "text", marks: [{ type: "code" }], text: "Tiptap" },
        { type: "text", text: ". Try clicking this " },
        {
          type: "text",
          marks: [{ type: "link", attrs: { href: "https://tiptap.dev" } }],
          text: "link to Tiptap",
        },
        { type: "text", text: "!" },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Try typing " },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " for commands, or select text for formatting." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Features" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Bubble menu - select text to format" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: 'Slash commands - type "/" for options' }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Links - select text and click L button" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: 'Tables - type "/table" to insert' }],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is a blockquote. Use " },
            { type: "text", marks: [{ type: "code" }], text: '"' },
            { type: "text", text: " from slash commands to create one." },
          ],
        },
      ],
    },
  ],
};

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

function LinkEditor({
  editor,
  onClose,
}: {
  editor: ReturnType<typeof useEditor>;
  onClose: () => void;
}) {
  const currentHref = editor?.getAttributes("link").href || "";
  const [url, setUrl] = useState(currentHref);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (url.trim()) {
        editor?.chain().focus().setLink({ href: url.trim() }).run();
      } else {
        editor?.chain().focus().unsetLink().run();
      }
      onClose();
    },
    [editor, url, onClose]
  );

  const handleRemove = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  return (
    <form onSubmit={handleSubmit} className="vizel-link-editor">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
        className="vizel-link-input"
        autoFocus
      />
      <button type="submit" className="vizel-link-button" title="Apply">
        OK
      </button>
      {currentHref && (
        <button
          type="button"
          onClick={handleRemove}
          className="vizel-link-button vizel-link-remove"
          title="Remove link"
        >
          X
        </button>
      )}
    </form>
  );
}

export function App() {
  const [output, setOutput] = useState<JSONContent | null>(null);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
        emptyEditorClass: "vizel-editor-empty",
        emptyNodeClass: "vizel-node-empty",
      }),
      SlashCommand.configure({
        items: defaultSlashCommands,
        suggestion: createSlashMenuRenderer(),
      }),
      createImageExtension(),
      createLinkExtension(),
      ...createTableExtensions(),
    ],
    content: initialContent,
    autofocus: "end",
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      setOutput(e.getJSON());
    },
    onCreate: ({ editor: e }) => {
      setOutput(e.getJSON());
    },
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <ReactLogo />
          <div className="header-text">
            <h1>Vizel Editor</h1>
            <span className="framework-badge">React 19</span>
          </div>
        </div>
        <p className="header-description">
          A Notion-style visual editor for modern web applications
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
        </div>

        <div className="editor-container">
          <div className="editor-root">
            <TiptapEditorContent editor={editor} className="editor-content" />
            {editor && (
              <BubbleMenu editor={editor}>
                {showLinkEditor ? (
                  <LinkEditor editor={editor} onClose={() => setShowLinkEditor(false)} />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`vizel-bubble-menu-button ${editor.isActive("bold") ? "is-active" : ""}`}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`vizel-bubble-menu-button ${editor.isActive("italic") ? "is-active" : ""}`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`vizel-bubble-menu-button ${editor.isActive("strike") ? "is-active" : ""}`}
                    >
                      <s>S</s>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleCode().run()}
                      className={`vizel-bubble-menu-button ${editor.isActive("code") ? "is-active" : ""}`}
                    >
                      {"</>"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLinkEditor(true)}
                      className={`vizel-bubble-menu-button ${editor.isActive("link") ? "is-active" : ""}`}
                    >
                      L
                    </button>
                  </>
                )}
              </BubbleMenu>
            )}
          </div>
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
