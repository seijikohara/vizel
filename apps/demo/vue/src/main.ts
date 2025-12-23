import { createApp, ref, onMounted, onBeforeUnmount, h } from "vue";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import {
  SlashCommand,
  defaultSlashCommands,
  createImageExtension,
} from "@vizel/core";
import tippy, { type Instance as TippyInstance } from "tippy.js";

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
              content: [
                { type: "text", text: "Bubble menu - select text to format" },
              ],
            },
          ],
        },
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
              content: [
                {
                  type: "text",
                  text: 'Markdown shortcuts - try "# " or "- " at start of line',
                },
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
          content: [{ type: "text", text: "This is a blockquote in Vue 3!" }],
        },
      ],
    },
  ],
};

// Vanilla JS Slash Menu Renderer
function createVanillaSlashMenuRenderer() {
  let popup: TippyInstance[] | null = null;
  let menuElement: HTMLElement | null = null;
  let selectedIndex = 0;
  let items: typeof defaultSlashCommands = [];
  let commandFn: ((item: (typeof defaultSlashCommands)[0]) => void) | null =
    null;

  function renderMenu() {
    if (!menuElement) return;
    menuElement.innerHTML = items
      .map(
        (item, index) => `
      <button class="vizel-slash-menu-item ${index === selectedIndex ? "is-selected" : ""}" data-index="${index}">
        <span class="vizel-slash-menu-icon">${item.icon}</span>
        <div class="vizel-slash-menu-text">
          <span class="vizel-slash-menu-title">${item.title}</span>
          <span class="vizel-slash-menu-description">${item.description}</span>
        </div>
      </button>
    `
      )
      .join("");

    menuElement.querySelectorAll(".vizel-slash-menu-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index") || "0");
        if (commandFn && items[index]) {
          commandFn(items[index]);
        }
      });
    });
  }

  return {
    render: () => ({
      onStart: (props: {
        items: typeof defaultSlashCommands;
        command: (item: (typeof defaultSlashCommands)[0]) => void;
        clientRect?: (() => DOMRect) | null;
      }) => {
        items = props.items;
        commandFn = props.command;
        selectedIndex = 0;

        menuElement = document.createElement("div");
        menuElement.className = "vizel-slash-menu";
        renderMenu();

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: menuElement,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate: (props: {
        items: typeof defaultSlashCommands;
        command: (item: (typeof defaultSlashCommands)[0]) => void;
        clientRect?: (() => DOMRect) | null;
      }) => {
        items = props.items;
        commandFn = props.command;
        selectedIndex = 0;
        renderMenu();

        if (props.clientRect) {
          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "ArrowUp") {
          selectedIndex = (selectedIndex + items.length - 1) % items.length;
          renderMenu();
          return true;
        }
        if (props.event.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % items.length;
          renderMenu();
          return true;
        }
        if (props.event.key === "Enter") {
          if (commandFn && items[selectedIndex]) {
            commandFn(items[selectedIndex]);
          }
          return true;
        }
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }
        return false;
      },

      onExit: () => {
        popup?.[0]?.destroy();
        menuElement = null;
      },
    }),
  };
}

const App = {
  setup() {
    const output = ref<Record<string, unknown> | null>(null);
    const editorElement = ref<HTMLElement | null>(null);
    const bubbleMenuElement = ref<HTMLElement | null>(null);
    let editor: Editor | null = null;

    onMounted(() => {
      if (editorElement.value) {
        editor = new Editor({
          element: editorElement.value,
          extensions: [
            StarterKit,
            Placeholder.configure({
              placeholder: "Type '/' for commands...",
              emptyEditorClass: "vizel-editor-empty",
              emptyNodeClass: "vizel-node-empty",
            }),
            BubbleMenu.configure({
              element: bubbleMenuElement.value!,
            }),
            SlashCommand.configure({
              items: defaultSlashCommands,
              suggestion: createVanillaSlashMenuRenderer(),
            }),
            createImageExtension(),
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

    const toggleBold = () => editor?.chain().focus().toggleBold().run();
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
    const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
    const toggleCode = () => editor?.chain().focus().toggleCode().run();

    return {
      output,
      editorElement,
      bubbleMenuElement,
      toggleBold,
      toggleItalic,
      toggleStrike,
      toggleCode,
    };
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
            h(
              "div",
              {
                ref: "bubbleMenuElement",
                class: "vizel-bubble-menu",
              },
              [
                h(
                  "button",
                  {
                    class: "vizel-bubble-menu-button",
                    onClick: this.toggleBold,
                  },
                  [h("strong", "B")]
                ),
                h(
                  "button",
                  {
                    class: "vizel-bubble-menu-button",
                    onClick: this.toggleItalic,
                  },
                  [h("em", "I")]
                ),
                h(
                  "button",
                  {
                    class: "vizel-bubble-menu-button",
                    onClick: this.toggleStrike,
                  },
                  [h("s", "S")]
                ),
                h(
                  "button",
                  {
                    class: "vizel-bubble-menu-button",
                    onClick: this.toggleCode,
                  },
                  "</>",
                ),
              ]
            ),
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
