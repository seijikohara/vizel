import type { Extensions } from "@tiptap/core";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";

export interface VizelTableOptions {
  /**
   * If enabled, tables can be resized.
   * @default false
   */
  resizable?: boolean;

  /**
   * Minimum width for table cells.
   * @default 50
   */
  cellMinWidth?: number;

  /**
   * If enabled, the last column can be resized.
   * @default true
   */
  lastColumnResizable?: boolean;

  /**
   * Additional HTML attributes for table elements.
   */
  tableHTMLAttributes?: Record<string, string>;
  headerHTMLAttributes?: Record<string, string>;
  cellHTMLAttributes?: Record<string, string>;
}

/**
 * Create table extensions for Vizel editor.
 * Returns an array of extensions: Table, TableRow, TableHeader, TableCell.
 *
 * @example
 * ```ts
 * const editor = new Editor({
 *   extensions: [
 *     ...createTableExtensions({ resizable: true }),
 *   ],
 * });
 *
 * // Insert a table
 * editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
 *
 * // Add row/column
 * editor.chain().focus().addRowAfter().run();
 * editor.chain().focus().addColumnAfter().run();
 *
 * // Delete row/column/table
 * editor.chain().focus().deleteRow().run();
 * editor.chain().focus().deleteColumn().run();
 * editor.chain().focus().deleteTable().run();
 * ```
 */
export function createTableExtensions(options: VizelTableOptions = {}): Extensions {
  return [
    Table.configure({
      resizable: options.resizable ?? false,
      cellMinWidth: options.cellMinWidth ?? 50,
      lastColumnResizable: options.lastColumnResizable ?? true,
      HTMLAttributes: {
        class: "vizel-table",
        ...options.tableHTMLAttributes,
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: "vizel-table-row",
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: "vizel-table-header",
        ...options.headerHTMLAttributes,
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: "vizel-table-cell",
        ...options.cellHTMLAttributes,
      },
    }),
  ];
}

export { Table, TableRow, TableHeader, TableCell };
