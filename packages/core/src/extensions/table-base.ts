import { Table, TableCell, TableHeader } from "@tiptap/extension-table";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { MarkdownSerializerState } from "prosemirror-markdown";

/**
 * Text alignment options for table cells.
 */
export type VizelTableCellAlignment = "left" | "center" | "right";

/**
 * Map a `textAlign` attribute to the corresponding GFM separator-row segment.
 */
function alignmentSegment(align: string | null | undefined): string {
  switch (align) {
    case "left":
      return ":---";
    case "center":
      return ":---:";
    case "right":
      return "---:";
    default:
      return "---";
  }
}

/**
 * Serialize a table node to GFM-flavored Markdown including alignment.
 *
 * The default `tiptap-markdown` table serializer drops the `textAlign`
 * attribute. Vizel preserves it so round-trips through the editor keep
 * the alignment exposed in the toolbar.
 */
function serializeTable(state: MarkdownSerializerState, node: PMNode): void {
  // Expose `inTable` to mark-string handlers (mirrors tiptap-markdown
  // behavior so inline marks emit table-safe escapes).
  (state as unknown as { inTable: boolean }).inTable = true;

  const rows: PMNode[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const row = node.child(i);
    rows.push(row);
  }
  if (rows.length === 0) {
    (state as unknown as { inTable: boolean }).inTable = false;
    return;
  }

  // Capture header alignments from the first row's cells.
  const headerRow = rows[0];
  if (!headerRow) {
    (state as unknown as { inTable: boolean }).inTable = false;
    return;
  }
  const alignments: (string | null)[] = [];
  for (let i = 0; i < headerRow.childCount; i++) {
    const cell = headerRow.child(i);
    const align = cell.attrs?.textAlign;
    alignments.push(typeof align === "string" ? align : null);
  }

  for (const [rowIndex, row] of rows.entries()) {
    state.write("| ");
    for (let cellIndex = 0; cellIndex < row.childCount; cellIndex++) {
      const cell = row.child(cellIndex);
      if (cellIndex > 0) {
        state.write(" | ");
      }
      const cellContent = cell.firstChild;
      if (cellContent?.textContent.trim()) {
        state.renderInline(cellContent);
      }
    }
    state.write(" |");
    state.ensureNewLine();

    if (rowIndex === 0) {
      const separator = alignments.map((align) => alignmentSegment(align)).join(" | ");
      state.write(`| ${separator} |`);
      state.ensureNewLine();
    }
  }

  state.closeBlock(node);
  (state as unknown as { inTable: boolean }).inTable = false;
}

/**
 * Extended Table with Markdown serialization support.
 *
 * Parsing relies on markdown-it's built-in GFM table tokenizer, which
 * emits standard `<table>` / `<thead>` / `<tbody>` HTML that the
 * Tiptap table parseHTML rules hydrate directly. Cell alignment is
 * recovered from the per-cell inline style by `VizelTableCell` /
 * `VizelTableHeader`.
 */
export const VizelTable = Table.extend({
  name: "table",

  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize: serializeTable,
        parse: {
          // markdown-it ships a GFM table rule; the rendered HTML
          // already matches Tiptap's parseHTML contract.
        },
      },
    };
  },
});

/**
 * Extended TableCell with textAlign attribute support.
 */
export const VizelTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign) {
            return {};
          }
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
});

/**
 * Extended TableHeader with textAlign attribute support.
 */
export const VizelTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign) {
            return {};
          }
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },
});
