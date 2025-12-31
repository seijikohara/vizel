import type { Editor } from "@tiptap/core";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

interface Range {
  from: number;
  to: number;
}

export const defaultSlashCommands = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "H1",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: "•",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: "1.",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Create a task list with checkboxes",
    icon: "☑",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote",
    icon: '"',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal divider",
    icon: "―",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Code Block",
    description: "Insert a code snippet",
    icon: "</>",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: "T",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Image",
    description: "Insert an image from URL",
    icon: "I",
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Upload Image",
    description: "Upload an image from your device",
    icon: "U",
    command: ({ editor, range }) => {
      // Delete the slash command text first
      try {
        editor.chain().focus().deleteRange(range).run();
      } catch {
        // Ignore errors from editor operations to ensure file picker opens
      }

      // Open file picker dialog (must happen synchronously in user event handler)
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          // Dispatch custom event for external handling
          const event = new CustomEvent("vizel:upload-image", {
            detail: { file, editor },
          });
          document.dispatchEvent(event);
        }
      };
      input.click();
    },
  },
  {
    title: "Math Equation",
    description: "Insert a mathematical expression",
    icon: "∑",
    command: ({ editor, range }) => {
      // Check if mathematics extension is available
      if (!editor.can().insertMathBlock?.({ latex: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertMathBlock({ latex: "" }).run();
    },
  },
  {
    title: "Inline Math",
    description: "Insert an inline math expression",
    icon: "x²",
    command: ({ editor, range }) => {
      // Check if mathematics extension is available
      if (!editor.can().insertMath?.({ latex: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertMath({ latex: "" }).run();
    },
  },
] satisfies SlashCommandItem[];

export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  return items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
}
