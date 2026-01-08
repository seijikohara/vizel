import type { JSONContent } from "@tiptap/core";
import { Table, TableCell, TableHeader } from "@tiptap/extension-table";

/**
 * Marked.js table token structure
 */
interface MarkedTableToken {
  type: "table";
  header: Array<{
    text: string;
    tokens: unknown[];
  }>;
  align: Array<"left" | "center" | "right" | null>;
  rows: Array<
    Array<{
      text: string;
      tokens: unknown[];
    }>
  >;
}

/**
 * Parse helpers provided by @tiptap/markdown
 */
interface MarkdownParseHelpers {
  parseInline: (tokens: unknown[]) => JSONContent[];
  parseChildren: (tokens: unknown[]) => JSONContent[];
  createTextNode: (text: string, marks?: unknown[]) => JSONContent;
  createNode: (
    type: string,
    attrs?: Record<string, unknown>,
    content?: JSONContent[]
  ) => JSONContent;
}

/**
 * Render helpers provided by @tiptap/markdown
 */
interface MarkdownRenderHelpers {
  renderChildren: (nodes: JSONContent[] | JSONContent, separator?: string) => string;
  indent: (content: string) => string;
  wrapInBlock: (prefix: string, content: string) => string;
}

/**
 * Render context provided by @tiptap/markdown
 */
interface MarkdownRenderContext {
  index: number;
  level: number;
  parentType?: string;
  meta: Record<string, unknown>;
}

/**
 * Text alignment options for table cells.
 */
export type VizelTableCellAlignment = "left" | "center" | "right";

/**
 * Parse cell content from marked token into Tiptap JSONContent.
 */
function parseCellContent(
  cell: { text: string; tokens: unknown[] },
  helpers: MarkdownParseHelpers
): JSONContent[] {
  if (cell.tokens) {
    return helpers.parseInline(cell.tokens);
  }
  if (cell.text) {
    return [helpers.createTextNode(cell.text)];
  }
  return [];
}

/**
 * Create paragraph content for a table cell.
 */
function createCellParagraph(content: JSONContent[], helpers: MarkdownParseHelpers): JSONContent[] {
  if (content.length > 0) {
    return [helpers.createNode("paragraph", undefined, content)];
  }
  return [helpers.createNode("paragraph")];
}

/**
 * Parse a marked table token into Tiptap table structure with alignment support.
 */
function parseMarkdownTable(
  token: MarkedTableToken,
  helpers: MarkdownParseHelpers
): JSONContent | null {
  const { header, align, rows } = token;

  // Create header row
  const headerCells: JSONContent[] = header.map((cell, index) => {
    const content = parseCellContent(cell, helpers);
    const attrs = align[index] ? { textAlign: align[index] } : undefined;
    return helpers.createNode("tableHeader", attrs, createCellParagraph(content, helpers));
  });

  const headerRow = helpers.createNode("tableRow", undefined, headerCells);

  // Create body rows
  const bodyRows: JSONContent[] = rows.map((row) => {
    const cells: JSONContent[] = row.map((cell, index) => {
      const content = parseCellContent(cell, helpers);
      const attrs = align[index] ? { textAlign: align[index] } : undefined;
      return helpers.createNode("tableCell", attrs, createCellParagraph(content, helpers));
    });

    return helpers.createNode("tableRow", undefined, cells);
  });

  return helpers.createNode("table", undefined, [headerRow, ...bodyRows]);
}

/**
 * Render a table node to Markdown with alignment support.
 */
function renderMarkdownTable(node: JSONContent, helpers: MarkdownRenderHelpers): string {
  if (!node.content || node.content.length === 0) {
    return "";
  }

  const rows = node.content;
  const firstRow = rows[0];
  if (!firstRow?.content) {
    return "";
  }

  // Detect column alignments from first row (header)
  const alignments: Array<"left" | "center" | "right" | null> = firstRow.content.map(
    (cell: JSONContent) => {
      return (cell.attrs?.textAlign as "left" | "center" | "right") || null;
    }
  );

  // Render each row
  const renderedRows: string[] = rows.map((row: JSONContent) => {
    if (!row.content) return "|";

    const cells = row.content.map((cell: JSONContent) => {
      // Render cell content
      const content = cell.content ? helpers.renderChildren(cell.content, "") : "";
      // Clean up: remove newlines and trim
      return content.replace(/\n/g, " ").trim();
    });

    return `| ${cells.join(" | ")} |`;
  });

  // Create alignment row
  const alignmentRow = alignments.map((align) => {
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
  });
  const alignmentRowStr = `| ${alignmentRow.join(" | ")} |`;

  // Insert alignment row after header
  if (renderedRows.length > 0) {
    return [renderedRows[0], alignmentRowStr, ...renderedRows.slice(1)].join("\n");
  }

  return renderedRows.join("\n");
}

/**
 * Extended Table with Markdown parsing/rendering support.
 */
export const VizelTable = Table.extend({
  // Register markdown name for token matching
  name: "table",

  addStorage() {
    return {
      ...this.parent?.(),
      // Mark this extension as markdown-aware
      markdown: {
        parse: parseMarkdownTable,
        serialize: renderMarkdownTable,
      },
    };
  },

  // Add markdown parsing support
  // @ts-expect-error - parseMarkdown is a @tiptap/markdown extension point
  parseMarkdown(token: MarkedTableToken, helpers: MarkdownParseHelpers) {
    if (token.type !== "table") return null;
    return parseMarkdownTable(token, helpers);
  },

  // Add markdown rendering support
  // @ts-expect-error - renderMarkdown is a @tiptap/markdown extension point
  renderMarkdown(
    node: JSONContent,
    helpers: MarkdownRenderHelpers,
    _context: MarkdownRenderContext
  ) {
    return renderMarkdownTable(node, helpers);
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
