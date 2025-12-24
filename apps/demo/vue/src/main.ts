import {
  BubbleMenuExtension,
  createImageExtension,
  createLinkExtension,
  createTableExtensions,
  createVanillaSlashMenuRenderer,
  defaultSlashCommands,
  Editor,
  Placeholder,
  SlashCommand,
  StarterKit,
} from "@vizel/vue";
import { createApp, h, onBeforeUnmount, onMounted, ref } from "vue";

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
              content: [{ type: "text", text: "Links - clickable hyperlinks" }],
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

// Vue Logo SVG
const VueLogo = {
  render() {
    return h(
      "svg",
      {
        viewBox: "0 0 128 128",
        class: "framework-logo",
      },
      [
        h("path", {
          fill: "currentColor",
          d: "M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z",
        }),
        h("path", {
          fill: "rgba(255,255,255,0.5)",
          d: "M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z",
        }),
      ]
    );
  },
};

const App = {
  setup() {
    const output = ref<Record<string, unknown> | null>(null);
    const editorElement = ref<HTMLElement | null>(null);
    const bubbleMenuElement = ref<HTMLElement | null>(null);
    const showOutput = ref(false);
    let editor: Editor | null = null;

    onMounted(() => {
      if (editorElement.value) {
        editor = new Editor({
          element: editorElement.value,
          extensions: [
            StarterKit.configure({
              link: false,
            }),
            Placeholder.configure({
              placeholder: "Type '/' for commands...",
              emptyEditorClass: "vizel-editor-empty",
              emptyNodeClass: "vizel-node-empty",
            }),
            BubbleMenuExtension.configure({
              element: bubbleMenuElement.value!,
            }),
            SlashCommand.configure({
              items: defaultSlashCommands,
              suggestion: createVanillaSlashMenuRenderer(),
            }),
            createImageExtension(),
            createLinkExtension(),
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

    const toggleBold = () => editor?.chain().focus().toggleBold().run();
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
    const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
    const toggleCode = () => editor?.chain().focus().toggleCode().run();
    const toggleOutput = () => {
      showOutput.value = !showOutput.value;
    };

    return {
      output,
      editorElement,
      bubbleMenuElement,
      showOutput,
      toggleBold,
      toggleItalic,
      toggleStrike,
      toggleCode,
      toggleOutput,
    };
  },
  render() {
    return h("div", { class: "app" }, [
      // Header
      h("header", { class: "header" }, [
        h("div", { class: "header-content" }, [
          h(VueLogo),
          h("div", { class: "header-text" }, [
            h("h1", "Vizel Editor"),
            h("span", { class: "framework-badge" }, "Vue 3"),
          ]),
        ]),
        h(
          "p",
          { class: "header-description" },
          "A Notion-style visual editor for modern web applications"
        ),
      ]),

      // Main
      h("main", { class: "main" }, [
        // Features Bar
        h("div", { class: "features-bar" }, [
          h("div", { class: "feature-tag" }, [
            h("span", { class: "feature-icon" }, "/"),
            h("span", "Slash Commands"),
          ]),
          h("div", { class: "feature-tag" }, [
            h("span", { class: "feature-icon" }, "B"),
            h("span", "Bubble Menu"),
          ]),
          h("div", { class: "feature-tag" }, [
            h("span", { class: "feature-icon" }, "T"),
            h("span", "Tables"),
          ]),
          h("div", { class: "feature-tag" }, [
            h("span", { class: "feature-icon" }, "L"),
            h("span", "Links"),
          ]),
        ]),

        // Editor Container
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
                  "</>"
                ),
              ]
            ),
          ]),
        ]),

        // Output Section
        h("div", { class: "output-section" }, [
          h(
            "button",
            {
              class: "output-toggle",
              onClick: this.toggleOutput,
            },
            [
              h("span", { class: "output-toggle-icon" }, this.showOutput ? "−" : "+"),
              h("span", "JSON Output"),
            ]
          ),
          this.showOutput
            ? h("pre", { class: "output-content" }, JSON.stringify(this.output, null, 2))
            : null,
        ]),
      ]),

      // Footer
      h("footer", { class: "footer" }, [
        h("p", ["Built with ", h("span", { class: "footer-highlight" }, "@vizel/vue")]),
      ]),
    ]);
  },
};

createApp(App).mount("#app");
