import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect } from "react";

type JSONContent = Record<string, unknown>;

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
        { type: "text", text: "." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Try typing " },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " for commands (coming soon)." },
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
          content: [
            { type: "text", text: "This is a blockquote. Use " },
            { type: "text", marks: [{ type: "code" }], text: ">" },
            { type: "text", text: " to create one." },
          ],
        },
      ],
    },
  ],
};

export function App() {
  const [output, setOutput] = useState<JSONContent | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
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
        <h1>Vizel Editor Demo</h1>
        <p>A Notion-style visual editor for React, Vue, and Svelte</p>
      </header>

      <main className="main">
        <div className="editor-container">
          <div className="editor-root">
            <EditorContent editor={editor} className="editor-content" />
          </div>
        </div>

        <details className="output">
          <summary>JSON Output</summary>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </details>
      </main>
    </div>
  );
}
