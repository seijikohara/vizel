<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    createVizelEditor,
    type Editor,
    type JSONContent,
  } from "@vizel/svelte";

  let editorElement: HTMLElement;
  let editor: Editor | null = $state(null);
  let output: JSONContent | null = $state(null);

  const initialContent: JSONContent = {
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
          { type: "text", marks: [{ type: "code" }], text: "@vizel/svelte" },
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
            content: [{ type: "text", text: "This is a blockquote in Svelte 5!" }],
          },
        ],
      },
    ],
  };

  onMount(() => {
    editor = createVizelEditor({
      element: editorElement,
      initialContent,
      placeholder: "Type '/' for commands...",
      autofocus: "end",
      onUpdate: ({ editor: e }) => {
        output = e.getJSON();
      },
      onCreate: ({ editor: e }) => {
        output = e.getJSON();
      },
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="app">
  <header class="header">
    <h1>Vizel Editor Demo</h1>
    <p>Svelte 5 • A Notion-style visual editor</p>
  </header>

  <main class="main">
    <div class="editor-container">
      <div class="editor-root">
        <div bind:this={editorElement} class="editor-content"></div>
      </div>
    </div>

    <details class="output">
      <summary>JSON Output</summary>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </details>
  </main>
</div>
