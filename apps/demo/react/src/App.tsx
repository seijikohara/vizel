import {
  BubbleMenu,
  createImageUploadExtension,
  createImageUploader,
  createLinkExtension,
  createSlashMenuRenderer,
  createTableExtensions,
  defaultSlashCommands,
  EditorContent,
  type JSONContent,
  Placeholder,
  SlashCommand,
  StarterKit,
  useEditor,
} from "@vizel/react";
import { useEffect, useState } from "react";

// Mock upload function that simulates server upload
async function mockUploadImage(file: File): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Convert to base64 for demo purposes
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const uploadOptions = {
  onUpload: mockUploadImage,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  onValidationError: (error: { message: string }) => {
    alert(`Validation error: ${error.message}`);
  },
  onUploadError: (error: Error) => {
    alert(`Upload failed: ${error.message}`);
  },
};

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

export function App() {
  const [output, setOutput] = useState<JSONContent | null>(null);
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
      ...createImageUploadExtension({
        upload: uploadOptions,
      }),
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

  // Handle vizel:upload-image custom event from slash command
  useEffect(() => {
    if (!editor) return;

    const uploadFn = createImageUploader(uploadOptions);

    const handleUploadEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ file: File }>;
      const { file } = customEvent.detail;
      const pos = editor.state.selection.from;
      uploadFn(file, editor.view, pos);
    };

    document.addEventListener("vizel:upload-image", handleUploadEvent);
    return () => {
      document.removeEventListener("vizel:upload-image", handleUploadEvent);
    };
  }, [editor]);

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
          <div className="feature-tag">
            <span className="feature-icon">U</span>
            <span>Image Upload</span>
          </div>
        </div>

        <div className="editor-container">
          <div className="editor-root">
            <EditorContent editor={editor} className="editor-content" />
            {editor && <BubbleMenu editor={editor} />}
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
