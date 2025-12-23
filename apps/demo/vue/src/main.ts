import { createApp, ref, onMounted, onBeforeUnmount, h } from "vue";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const initialContent = {
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

const App = {
  setup() {
    const output = ref<Record<string, unknown> | null>(null);
    const editorElement = ref<HTMLElement | null>(null);
    let editor: Editor | null = null;

    onMounted(() => {
      if (editorElement.value) {
        editor = new Editor({
          element: editorElement.value,
          extensions: [
            StarterKit,
            Placeholder.configure({
              placeholder: "Type '/' for commands...",
            }),
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

    return { output, editorElement };
  },
  render() {
    return h("div", { class: "app" }, [
      h("header", { class: "header" }, [
        h("h1", "Vizel Editor Demo"),
        h("p", "Vue 3 • A Notion-style visual editor"),
      ]),
      h("main", { class: "main" }, [
        h("div", { class: "editor-container" }, [
          h("div", { class: "editor-root" }, [
            h("div", {
              ref: "editorElement",
              class: "editor-content",
            }),
          ]),
        ]),
        h("details", { class: "output" }, [
          h("summary", "JSON Output"),
          h("pre", JSON.stringify(this.output, null, 2)),
        ]),
      ]),
    ]);
  },
};

createApp(App).mount("#app");
