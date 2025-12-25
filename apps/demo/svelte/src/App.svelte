<script lang="ts">
import { BubbleMenu, EditorContent, type JSONContent, useVizelEditor } from "@vizel/svelte";

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

let output: JSONContent | null = $state(null);
let showOutput = $state(false);

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

const editor = useVizelEditor({
  initialContent,
  autofocus: "end",
  features: {
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
  onUpdate: ({ editor: e }) => {
    output = e.getJSON();
  },
  onCreate: ({ editor: e }) => {
    output = e.getJSON();
  },
});
</script>

<div class="app">
  <header class="header">
    <div class="header-content">
      <svg class="framework-logo" viewBox="0 0 98.1 118">
        <path fill="currentColor" d="M91.8 15.6C80.9-.1 59.2-4.7 43.6 5.2L16.1 22.8C8.6 27.5 3.4 35.2 1.9 43.9c-1.3 7.3-.2 14.8 3.3 21.3-2.4 3.6-4 7.6-4.7 11.8-1.6 8.9.5 18.1 5.7 25.4 11 15.7 32.6 20.3 48.2 10.4l27.5-17.5c7.5-4.7 12.7-12.4 14.2-21.1 1.3-7.3.2-14.8-3.3-21.3 2.4-3.6 4-7.6 4.7-11.8 1.7-9-.4-18.2-5.7-25.5"/>
        <path fill="rgba(255,255,255,0.3)" d="M40.9 103.9c-8.9 2.3-18.2-1.2-23.4-8.7-3.2-4.4-4.4-9.9-3.5-15.3.2-.9.4-1.7.6-2.6l.5-1.6 1.4 1c3.3 2.4 6.9 4.2 10.8 5.4l1 .3-.1 1c-.1 1.4.3 2.9 1.1 4.1 1.6 2.3 4.4 3.4 7.1 2.7.6-.2 1.2-.4 1.7-.7L65.5 72c1.4-.9 2.3-2.2 2.6-3.8.3-1.6-.1-3.3-1-4.6-1.6-2.3-4.4-3.3-7.1-2.6-.6.2-1.2.4-1.7.7l-10.5 6.7c-1.7 1.1-3.6 1.9-5.6 2.4-8.9 2.3-18.2-1.2-23.4-8.7-3.1-4.4-4.4-9.9-3.4-15.3.9-5.2 4.1-9.9 8.6-12.7l27.5-17.5c1.7-1.1 3.6-1.9 5.6-2.5 8.9-2.3 18.2 1.2 23.4 8.7 3.2 4.4 4.4 9.9 3.5 15.3-.2.9-.4 1.7-.7 2.6l-.5 1.6-1.4-1c-3.3-2.4-6.9-4.2-10.8-5.4l-1-.3.1-1c.1-1.4-.3-2.9-1.1-4.1-1.6-2.3-4.4-3.3-7.1-2.6-.6.2-1.2.4-1.7.7L32.4 46c-1.4.9-2.3 2.2-2.6 3.8s.1 3.3 1 4.6c1.6 2.3 4.4 3.3 7.1 2.6.6-.2 1.2-.4 1.7-.7l10.5-6.7c1.7-1.1 3.6-1.9 5.6-2.5 8.9-2.3 18.2 1.2 23.4 8.7 3.2 4.4 4.4 9.9 3.5 15.3-.9 5.2-4.1 9.9-8.6 12.7l-27.5 17.5c-1.7 1.1-3.6 1.9-5.6 2.5"/>
      </svg>
      <div class="header-text">
        <h1>Vizel Editor</h1>
        <span class="framework-badge">Svelte 5</span>
      </div>
    </div>
    <p class="header-description">
      A Notion-style visual editor for modern web applications
    </p>
  </header>

  <main class="main">
    <div class="features-bar">
      <div class="feature-tag">
        <span class="feature-icon">/</span>
        <span>Slash Commands</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">B</span>
        <span>Bubble Menu</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">T</span>
        <span>Tables</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">L</span>
        <span>Links</span>
      </div>
      <div class="feature-tag">
        <span class="feature-icon">U</span>
        <span>Image Upload</span>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-root">
        <EditorContent editor={editor.current} class="editor-content" />
        {#if editor.current}
          <BubbleMenu editor={editor.current} />
        {/if}
      </div>
    </div>

    <div class="output-section">
      <button
        type="button"
        class="output-toggle"
        onclick={() => showOutput = !showOutput}
      >
        <span class="output-toggle-icon">{showOutput ? '−' : '+'}</span>
        <span>JSON Output</span>
      </button>
      {#if showOutput}
        <pre class="output-content">{JSON.stringify(output, null, 2)}</pre>
      {/if}
    </div>
  </main>

  <footer class="footer">
    <p>
      Built with <span class="footer-highlight">@vizel/svelte</span>
    </p>
  </footer>
</div>
