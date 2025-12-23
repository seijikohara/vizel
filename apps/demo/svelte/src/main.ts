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
          content: [{ type: "text", text: "This is a blockquote in Svelte!" }],
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

// Create the app HTML structure
const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="app">
    <header class="header">
      <h1>Vizel Editor Demo</h1>
      <p>Svelte • A Notion-style visual editor</p>
    </header>

    <main class="main">
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

      <details class="output">
        <summary>JSON Output</summary>
        <pre id="output"></pre>
      </details>
    </main>
  </div>
`;

const editorElement = document.getElementById("editor")!;
const outputElement = document.getElementById("output")!;
const bubbleMenuElement = document.getElementById("bubble-menu")!;

const editor = new Editor({
  element: editorElement,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Type '/' for commands...",
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
    BubbleMenu.configure({
      element: bubbleMenuElement,
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
