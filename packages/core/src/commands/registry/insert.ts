import { emitVizelError, VizelError } from "../../utils/errorHandling.ts";
import type { VizelCommand } from "../types.ts";

/**
 * Insert commands that create new nodes (table, image, embed, math,
 * diagram, table of contents).
 *
 * These commands appear in the slash menu. They have no shortcut by
 * default because the shortcut keyspace is reserved for marks and
 * common block changes.
 */
export const vizelInsertCommands: readonly VizelCommand[] = [
  {
    id: "insert/table",
    label: (locale) => locale.slashMenu.items.table.title,
    description: (locale) => locale.slashMenu.items.table.description,
    icon: "table",
    group: "Blocks",
    keywords: ["grid", "spreadsheet", "columns", "rows"],
    canRun: (editor) => editor.can().insertTable?.({ rows: 1, cols: 1 }) ?? false,
    run: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    surfaces: {
      slashMenu: { priority: 300 },
    },
  },
  {
    id: "insert/image",
    label: (locale) => locale.slashMenu.items.image.title,
    description: (locale) => locale.slashMenu.items.image.description,
    icon: "image",
    group: "Media",
    keywords: ["picture", "photo", "img", "url"],
    canRun: (editor) => typeof editor.commands.setImage === "function",
    run: (editor) => {
      // window.prompt is the legacy slash-menu UX. Section 11 replaces
      // it with a proper VizelLinkEditor-style form; the run callback
      // continues to work in the meantime.
      if (typeof window === "undefined") return false;
      const url = window.prompt("Enter image URL:");
      if (!url) return false;
      return editor.chain().focus().setImage({ src: url }).run();
    },
    surfaces: {
      slashMenu: { priority: 310 },
    },
  },
  {
    id: "insert/uploadImage",
    label: (locale) => locale.slashMenu.items.uploadImage.title,
    description: (locale) => locale.slashMenu.items.uploadImage.description,
    icon: "imageUpload",
    group: "Media",
    keywords: ["picture", "photo", "upload", "file"],
    canRun: (editor) => typeof editor.commands.setImage === "function",
    run: (editor) => {
      if (typeof document === "undefined") return false;
      // The file picker dialog MUST be opened on the same stack frame
      // as the user event to bypass the browser popup suppressor. If
      // the chain throws (mid-run document mutation), we still need to
      // open the picker, so wrap the chain in try/catch.
      try {
        editor.chain().focus().run();
      } catch (error) {
        emitVizelError(
          new VizelError("UNKNOWN_ERROR", "Failed to focus editor before opening file picker.", {
            cause: error,
            severity: "warning",
          }),
          undefined
        );
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const event = new CustomEvent("vizel:upload-image", {
          detail: { file, editor },
        });
        document.dispatchEvent(event);
      };
      input.click();
      return true;
    },
    surfaces: {
      slashMenu: { priority: 320 },
    },
  },
  {
    id: "insert/embed",
    label: (locale) => locale.slashMenu.items.embed.title,
    description: (locale) => locale.slashMenu.items.embed.description,
    icon: "embed",
    group: "Media",
    keywords: ["link", "url", "youtube", "video", "twitter", "embed", "iframe", "oembed"],
    canRun: (editor) =>
      typeof editor.commands.setEmbed === "function" ||
      typeof editor.commands.setLink === "function",
    run: (editor) => {
      if (typeof window === "undefined") return false;
      const hasEmbed = typeof editor.commands.setEmbed === "function";
      if (!hasEmbed) {
        const url = window.prompt("Enter URL:");
        if (!url) return false;
        return editor.chain().focus().setLink({ href: url }).run();
      }
      const url = window.prompt("Enter URL to embed:");
      if (!url) return false;
      return editor.chain().focus().setEmbed({ url }).run();
    },
    surfaces: {
      slashMenu: { priority: 330 },
    },
  },
  {
    id: "insert/tableOfContents",
    label: (locale) => locale.slashMenu.items.tableOfContents.title,
    description: (locale) => locale.slashMenu.items.tableOfContents.description,
    icon: "tableOfContents",
    group: "Navigation",
    keywords: ["toc", "navigation", "outline", "headings", "contents", "index"],
    canRun: (editor) => typeof editor.commands.insertTableOfContents === "function",
    run: (editor) => editor.chain().focus().insertTableOfContents().run(),
    surfaces: {
      slashMenu: { priority: 400 },
    },
  },
  {
    id: "insert/mathEquation",
    label: (locale) => locale.slashMenu.items.mathEquation.title,
    description: (locale) => locale.slashMenu.items.mathEquation.description,
    icon: "mathBlock",
    group: "Advanced",
    keywords: ["latex", "formula", "equation", "katex", "math"],
    canRun: (editor) => editor.can().insertMathBlock?.({ latex: "" }) ?? false,
    run: (editor) => editor.chain().focus().insertMathBlock({ latex: "" }).run(),
    surfaces: {
      slashMenu: { priority: 500 },
    },
  },
  {
    id: "insert/inlineMath",
    label: (locale) => locale.slashMenu.items.inlineMath.title,
    description: (locale) => locale.slashMenu.items.inlineMath.description,
    icon: "mathInline",
    group: "Advanced",
    keywords: ["latex", "formula", "inline", "katex", "math"],
    canRun: (editor) => editor.can().insertMath?.({ latex: "" }) ?? false,
    run: (editor) => editor.chain().focus().insertMath({ latex: "" }).run(),
    surfaces: {
      slashMenu: { priority: 510 },
    },
  },
  {
    id: "insert/mermaidDiagram",
    label: (locale) => locale.slashMenu.items.mermaidDiagram.title,
    description: (locale) => locale.slashMenu.items.mermaidDiagram.description,
    icon: "mermaid",
    group: "Advanced",
    keywords: ["diagram", "chart", "flowchart", "mermaid", "sequence", "graph", "uml"],
    canRun: (editor) => editor.can().insertDiagram?.({ code: "" }) ?? false,
    run: (editor) => editor.chain().focus().insertDiagram({ code: "", type: "mermaid" }).run(),
    surfaces: {
      slashMenu: { priority: 520 },
    },
  },
  {
    id: "insert/graphvizDiagram",
    label: (locale) => locale.slashMenu.items.graphvizDiagram.title,
    description: (locale) => locale.slashMenu.items.graphvizDiagram.description,
    icon: "graphviz",
    group: "Advanced",
    keywords: ["diagram", "graphviz", "dot", "graph", "network", "nodes", "edges"],
    canRun: (editor) => editor.can().insertDiagram?.({ code: "" }) ?? false,
    run: (editor) => editor.chain().focus().insertDiagram({ code: "", type: "graphviz" }).run(),
    surfaces: {
      slashMenu: { priority: 530 },
    },
  },
];
