import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const initialContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Vizel Editor (Svelte)" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a " },
        { type: "text", marks: [{ type: "bold" }], text: "Notion-style" },
        { type: "text", text: " visual editor built with " },
        { type: "text", marks: [{ type: "code" }], text: "Tiptap" },
        { type: "text", text: "." },
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
              content: [{ type: "text", text: "Rich text formatting" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Headings (H1-H3)" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Lists and blockquotes" }],
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
          content: [{ type: "text", text: "This is a blockquote!" }],
        },
      ],
    },
  ],
};

// Create the app HTML structure
const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="app">
    <header class="header">
      <h1>Vizel Editor Demo</h1>
      <p>Vanilla JS • A Notion-style visual editor</p>
    </header>

    <main class="main">
      <div class="editor-container">
        <div class="editor-root">
          <div id="editor" class="editor-content"></div>
        </div>
      </div>

      <details class="output">
        <summary>JSON Output</summary>
        <pre id="output"></pre>
      </details>
    </main>
  </div>
`;

const editorElement = document.getElementById("editor")!;
const outputElement = document.getElementById("output")!;

const editor = new Editor({
  element: editorElement,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Type '/' for commands...",
    }),
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
