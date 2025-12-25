<script setup lang="ts">
import { BubbleMenu, EditorContent, type JSONContent, useVizelEditor } from "@vizel/vue";
import { ref } from "vue";

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

const output = ref<JSONContent | null>(null);
const showOutput = ref(false);

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
    output.value = e.getJSON();
  },
  onCreate: ({ editor: e }) => {
    output.value = e.getJSON();
  },
});
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <svg class="framework-logo" viewBox="0 0 128 128">
          <path fill="currentColor" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110H78.8z" />
          <path fill="currentColor" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z" opacity="0.6" />
        </svg>
        <div class="header-text">
          <h1>Vizel Editor</h1>
          <span class="framework-badge">Vue 3</span>
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
          <EditorContent :editor="editor" class="editor-content" />
          <BubbleMenu v-if="editor" :editor="editor" />
        </div>
      </div>

      <div class="output-section">
        <button
          type="button"
          class="output-toggle"
          @click="showOutput = !showOutput"
        >
          <span class="output-toggle-icon">{{ showOutput ? '−' : '+' }}</span>
          <span>JSON Output</span>
        </button>
        <pre v-if="showOutput" class="output-content">{{ JSON.stringify(output, null, 2) }}</pre>
      </div>
    </main>

    <footer class="footer">
      <p>
        Built with <span class="footer-highlight">@vizel/vue</span>
      </p>
    </footer>
  </div>
</template>
