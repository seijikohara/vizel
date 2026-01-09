<script setup lang="ts">
import { type Editor, getVizelEditorState, useVizelState, Vizel } from "../../../packages/vue/src";
import "../../../packages/core/dist/styles.css";
import "../../../packages/core/dist/components.css";
import { computed, ref } from "vue";

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
        { type: "text", marks: [{ type: "bold" }], text: "block-based rich text" },
        { type: "text", text: " visual editor. Try typing " },
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
              content: [{ type: "text", text: 'Slash commands - type "/" for options' }],
            },
          ],
        },
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
              content: [{ type: "text", text: "Drag handle - reorder blocks" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Tables, code blocks, images, and more" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Task List" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Try the slash commands" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Select text to see bubble menu" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Insert a table or code block" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Code Block" }],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript", lineNumbers: true },
      content: [
        {
          type: "text",
          text: 'import { Vizel } from "@vizel/vue";\nimport "@vizel/core/styles.css";\n\n// Use in your Vue component\n<Vizel placeholder="Type / for commands..." />',
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Mathematics" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Inline math: " },
        { type: "mathInline", attrs: { latex: "E = mc^2" } },
        { type: "text", text: " and block equations:" },
      ],
    },
    {
      type: "mathBlock",
      attrs: { latex: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}" },
    },
  ],
};

const editorRef = ref<Editor | null>(null);

function handleCreate({ editor }: { editor: Editor }) {
  editorRef.value = editor;
}

const updateCount = useVizelState(() => editorRef.value);
const editorState = computed(() => {
  void updateCount.value;
  return getVizelEditorState(editorRef.value);
});
</script>

<template>
  <div class="vizel-demo vp-raw">
    <div class="vizel-demo-editor">
      <Vizel
        :initial-content="initialContent"
        :autofocus="false"
        class="editor-content"
        @create="handleCreate"
      />
    </div>
    <div class="vizel-demo-status">
      <span>{{ editorState.characterCount }} characters</span>
      <span class="divider">|</span>
      <span>{{ editorState.wordCount }} words</span>
    </div>
  </div>
</template>

<style scoped>
.vizel-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.vizel-demo-editor {
  min-height: 500px;
  background: var(--vp-c-bg);
}

.vizel-demo-editor :deep(.vizel-editor) {
  padding: 1.5rem;
  min-height: 500px;
}

.vizel-demo-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.vizel-demo-status .divider {
  color: var(--vp-c-divider);
}
</style>
