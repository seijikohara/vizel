<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  SlashCommand,
  defaultSlashCommands,
  createLinkExtension,
  createImageExtension,
  createTableExtensions,
} from "@vizel/core";

type JSONContent = Record<string, unknown>;

const output = ref<JSONContent | null>(null);
const editorRef = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

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
        { type: "text", text: " for commands." },
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
              content: [
                { type: "text", text: 'Slash commands - type "/" for options' },
              ],
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
              content: [
                { type: "text", text: 'Tables - type "/table" to insert' },
              ],
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

onMounted(() => {
  if (editorRef.value) {
    editor = new Editor({
      element: editorRef.value,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: "Type '/' for commands...",
          emptyEditorClass: "vizel-editor-empty",
          emptyNodeClass: "vizel-node-empty",
        }),
        SlashCommand.configure({
          items: defaultSlashCommands,
        }),
        createLinkExtension(),
        createImageExtension(),
        ...createTableExtensions(),
      ],
      content: initialContent,
      autofocus: "end",
      onUpdate: ({ editor: e }) => {
        output.value = e.getJSON();
      },
      onCreate: ({ editor: e }) => {
        output.value = e.getJSON();
      },
    });
  }
});

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy();
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
        <div class="editor-root">
          <div ref="editorRef" class="editor-content"></div>
        </div>
      </div>

      <details class="output">
        <summary>JSON Output</summary>
        <pre>{{ JSON.stringify(output, null, 2) }}</pre>
      </details>
    </main>
  </div>
</template>
