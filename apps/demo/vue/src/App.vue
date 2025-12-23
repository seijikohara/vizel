<script setup lang="ts">
import { ref, watch } from "vue";
import {
  EditorRoot,
  EditorContent,
  useVizelEditor,
  type JSONContent,
} from "@vizel/vue";

const output = ref<JSONContent | null>(null);

const initialContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Vizel Editor (Vue)" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a " },
        { type: "text", marks: [{ type: "bold" }], text: "Notion-style" },
        { type: "text", text: " visual editor built with " },
        { type: "text", marks: [{ type: "code" }], text: "@vizel/vue" },
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
          content: [{ type: "text", text: "This is a blockquote in Vue 3!" }],
        },
      ],
    },
  ],
};

const editor = useVizelEditor({
  initialContent,
  placeholder: "Type '/' for commands...",
  autofocus: "end",
  onUpdate: ({ editor: e }) => {
    output.value = e.getJSON();
  },
});

watch(editor, (newEditor) => {
  if (newEditor) {
    output.value = newEditor.getJSON();
  }
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Vizel Editor Demo</h1>
      <p>Vue 3 • A Notion-style visual editor</p>
    </header>

    <main class="main">
      <div class="editor-container">
        <EditorRoot :editor="editor" class="editor-root">
          <EditorContent :editor="editor" class="editor-content" />
        </EditorRoot>
      </div>

      <details class="output">
        <summary>JSON Output</summary>
        <pre>{{ JSON.stringify(output, null, 2) }}</pre>
      </details>
    </main>
  </div>
</template>
