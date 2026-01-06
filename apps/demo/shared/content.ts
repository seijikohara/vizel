/** Initial editor content for demo applications */
export const initialContent = {
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
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: 'Task lists - type "[ ]" or "/task" to create' }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: 'Dividers - type "---" or "/divider" to insert' }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Task List Example" }],
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
              content: [{ type: "text", text: "Build the editor core" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Add React/Vue/Svelte support" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Add more features" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Write documentation" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Table Example" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Hover over column borders (top) to insert columns, row borders (left) to insert rows. Click the column/row handle for options including alignment. Column alignment is Markdown-compatible (",
        },
        { type: "text", marks: [{ type: "code" }], text: "|:---|:---:|---:|" },
        { type: "text", text: ")." },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Feature" }],
                },
              ],
            },
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Description" }],
                },
              ],
            },
            {
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1, textAlign: "center" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Status" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Column Insert" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Hover near column borders to add columns" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, textAlign: "center" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "✓" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Row Insert" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Hover near row borders to add rows" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, textAlign: "center" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "✓" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Row Handle" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Click handle for edit menu" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, textAlign: "center" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "✓" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Column Align" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Click column handle to set alignment" }],
                },
              ],
            },
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, textAlign: "center" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "✓" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Code Block with Syntax Highlighting" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Type " },
        { type: "text", marks: [{ type: "code" }], text: '"/code"' },
        {
          type: "text",
          text: " to insert a code block. Select language from dropdown or type your own.",
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript", lineNumbers: true },
      content: [
        {
          type: "text",
          text: 'import { createVizelExtensions } from "@vizel/core";\n\nconst extensions = createVizelExtensions({\n  features: {\n    codeBlock: {\n      defaultLanguage: "typescript",\n      lineNumbers: true,\n    },\n  },\n});',
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "python", lineNumbers: false },
      content: [
        {
          type: "text",
          text: 'def greet(name: str) -> str:\n    """Return a greeting message."""\n    return f"Hello, {name}!"',
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Mathematics (LaTeX)" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Type " },
        { type: "text", marks: [{ type: "code" }], text: "$E=mc^2$" },
        { type: "text", text: " for inline math or " },
        { type: "text", marks: [{ type: "code" }], text: "$$...$$" },
        { type: "text", text: " for block equations. Here's an inline example: " },
        { type: "mathInline", attrs: { latex: "E = mc^2" } },
        { type: "text", text: " (Einstein's famous equation)." },
      ],
    },
    {
      type: "mathBlock",
      attrs: { latex: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}" },
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Click on any math expression to edit it." }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Diagrams (Mermaid)" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Type " },
        { type: "text", marks: [{ type: "code" }], text: '"/mermaid"' },
        {
          type: "text",
          text: " to insert a diagram. Click on the diagram to edit its Mermaid code.",
        },
      ],
    },
    {
      type: "diagram",
      attrs: {
        code: "flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E",
        type: "mermaid",
      },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Mermaid supports many diagram types: flowcharts, sequence diagrams, class diagrams, and more.",
        },
      ],
    },
    {
      type: "diagram",
      attrs: {
        code: "sequenceDiagram\n    participant User\n    participant Editor\n    participant Server\n    User->>Editor: Type text\n    Editor->>Server: Save content\n    Server-->>Editor: Confirm save\n    Editor-->>User: Show saved indicator",
        type: "mermaid",
      },
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
    {
      type: "horizontalRule",
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Use " },
        { type: "text", marks: [{ type: "code" }], text: "---" },
        { type: "text", text: " or " },
        { type: "text", marks: [{ type: "code" }], text: '"/divider"' },
        { type: "text", text: " to insert a horizontal divider like the one above." },
      ],
    },
  ],
};
