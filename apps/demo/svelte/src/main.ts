import {
  BubbleMenuExtension,
  createImageExtension,
  createLinkExtension,
  createTableExtensions,
  createVanillaSlashMenuRenderer,
  defaultSlashCommands,
  Editor,
  Placeholder,
  SlashCommand,
  StarterKit,
} from "@vizel/svelte";

const initialContent = {
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
              content: [{ type: "text", text: "Links - clickable hyperlinks" }],
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

// Create the app HTML structure with Svelte branding
const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="app">
    <header class="header">
      <div class="header-content">
        <svg viewBox="0 0 98.1 118" class="framework-logo">
          <path fill="currentColor" d="M91.8,15.6C80.9-0.1,59.2-4.7,43.6,5.2L16.1,22.8C8.6,27.5,3.4,35.2,1.9,43.9c-1.3,7.3-0.2,14.8,3.3,21.3
            c-2.4,3.6-4,7.6-4.7,11.8c-1.6,8.9,0.5,18.1,5.7,25.4c11,15.7,32.6,20.3,48.2,10.4l27.5-17.5c7.5-4.7,12.7-12.4,14.2-21.1
            c1.3-7.3,0.2-14.8-3.3-21.3c2.4-3.6,4-7.6,4.7-11.8C99.1,32.2,97,23,91.8,15.6z"/>
          <path fill="rgba(255,255,255,0.5)" d="M40.9,103.9c-8.9,2.3-18.2-1.2-23.4-8.7c-3.2-4.4-4.4-9.9-3.5-15.3c0.2-0.9,0.4-1.7,0.6-2.6l0.5-1.6l1.4,1
            c3.3,2.4,6.9,4.2,10.8,5.4l1,0.3l-0.1,1c-0.1,1.4,0.3,2.9,1.1,4.1c1.6,2.3,4.4,3.4,7.1,2.7c0.6-0.2,1.2-0.4,1.7-0.7L65.5,72
            c1.4-0.9,2.3-2.2,2.6-3.8c0.3-1.6-0.1-3.3-1-4.6c-1.6-2.3-4.4-3.3-7.1-2.6c-0.6,0.2-1.2,0.4-1.7,0.7l-10.5,6.7
            c-1.7,1.1-3.6,1.9-5.6,2.4c-8.9,2.3-18.2-1.2-23.4-8.7c-3.1-4.4-4.4-9.9-3.4-15.3c0.9-5.2,4.1-9.9,8.6-12.7l27.5-17.5
            c1.7-1.1,3.6-1.9,5.6-2.5c8.9-2.3,18.2,1.2,23.4,8.7c3.2,4.4,4.4,9.9,3.5,15.3c-0.2,0.9-0.4,1.7-0.7,2.6l-0.5,1.6l-1.4-1
            c-3.3-2.4-6.9-4.2-10.8-5.4l-1-0.3l0.1-1c0.1-1.4-0.3-2.9-1.1-4.1c-1.6-2.3-4.4-3.3-7.1-2.6c-0.6,0.2-1.2,0.4-1.7,0.7L32.4,46
            c-1.4,0.9-2.3,2.2-2.6,3.8s0.1,3.3,1,4.6c1.6,2.3,4.4,3.3,7.1,2.6c0.6-0.2,1.2-0.4,1.7-0.7l10.5-6.7c1.7-1.1,3.6-1.9,5.6-2.5
            c8.9-2.3,18.2,1.2,23.4,8.7c3.2,4.4,4.4,9.9,3.5,15.3c-0.9,5.2-4.1,9.9-8.6,12.7l-27.5,17.5C44.8,102.5,42.9,103.3,40.9,103.9z"/>
        </svg>
        <div class="header-text">
          <h1>Vizel Editor</h1>
          <span class="framework-badge">Svelte 5</span>
        </div>
      </div>
      <p class="header-description">A Notion-style visual editor for modern web applications</p>
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
      </div>

      <div class="editor-container">
        <div class="editor-root">
          <div id="editor" class="editor-content"></div>
          <div id="bubble-menu" class="vizel-bubble-menu">
            <button class="vizel-bubble-menu-button" data-action="bold"><strong>B</strong></button>
            <button class="vizel-bubble-menu-button" data-action="italic"><em>I</em></button>
            <button class="vizel-bubble-menu-button" data-action="strike"><s>S</s></button>
            <button class="vizel-bubble-menu-button" data-action="code">&lt;/&gt;</button>
          </div>
        </div>
      </div>

      <div class="output-section">
        <button class="output-toggle" id="output-toggle">
          <span class="output-toggle-icon" id="output-icon">+</span>
          <span>JSON Output</span>
        </button>
        <pre class="output-content" id="output" style="display: none;"></pre>
      </div>
    </main>

    <footer class="footer">
      <p>Built with <span class="footer-highlight">@vizel/svelte</span></p>
    </footer>
  </div>
`;

const editorElement = document.getElementById("editor")!;
const outputElement = document.getElementById("output")!;
const bubbleMenuElement = document.getElementById("bubble-menu")!;
const outputToggle = document.getElementById("output-toggle")!;
const outputIcon = document.getElementById("output-icon")!;

let showOutput = false;

outputToggle.addEventListener("click", () => {
  showOutput = !showOutput;
  outputElement.style.display = showOutput ? "block" : "none";
  outputIcon.textContent = showOutput ? "−" : "+";
});

const editor = new Editor({
  element: editorElement,
  extensions: [
    StarterKit.configure({
      link: false,
    }),
    Placeholder.configure({
      placeholder: "Type '/' for commands...",
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
    BubbleMenuExtension.configure({
      element: bubbleMenuElement,
    }),
    SlashCommand.configure({
      items: defaultSlashCommands,
      suggestion: createVanillaSlashMenuRenderer(),
    }),
    createImageExtension(),
    createLinkExtension(),
    ...createTableExtensions(),
  ],
  content: initialContent,
  autofocus: "end",
  onUpdate: ({ editor: e }) => {
    outputElement.textContent = JSON.stringify(e.getJSON(), null, 2);
  },
  onCreate: ({ editor: e }) => {
    outputElement.textContent = JSON.stringify(e.getJSON(), null, 2);
  },
});

// Setup bubble menu button handlers
bubbleMenuElement.querySelectorAll(".vizel-bubble-menu-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    switch (action) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "strike":
        editor.chain().focus().toggleStrike().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;
    }
  });
});
