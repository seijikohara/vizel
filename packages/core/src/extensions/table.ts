import type { Extensions } from "@tiptap/core";
import { TableRow } from "@tiptap/extension-table";
import {
  VizelTable,
  VizelTableCell,
  type VizelTableCellAlignment,
  VizelTableHeader,
} from "./table-base";
import { type VizelTableControlsOptions, VizelTableWithControls } from "./table-controls";

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
   * Enable interactive table controls (column/row insert buttons, row handle with menu).
   * Set to `true` to enable all controls, `false` to disable, or an object to customize.
   * @default true
   */
  controls?: boolean | VizelTableControlsOptions;

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
 *     ...createVizelTableExtensions({ resizable: true }),
 *   ],
 * });
 *
 * // Insert a table
 * editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
 *
 * // Column operations
 * editor.chain().focus().addColumnBefore().run(); // Add column at the beginning/middle
 * editor.chain().focus().addColumnAfter().run();  // Add column at the end/middle
 * editor.chain().focus().deleteColumn().run();
 *
 * // Row operations
 * editor.chain().focus().addRowBefore().run();    // Add row at the beginning/middle
 * editor.chain().focus().addRowAfter().run();     // Add row at the end/middle
 * editor.chain().focus().deleteRow().run();
 *
 * // Delete table
 * editor.chain().focus().deleteTable().run();
 *
 * // Cell alignment
 * editor.chain().focus().setCellAttribute('textAlign', 'left').run();
 * editor.chain().focus().setCellAttribute('textAlign', 'center').run();
 * editor.chain().focus().setCellAttribute('textAlign', 'right').run();
 *
 * // Merge and split cells
 * editor.chain().focus().mergeCells().run();
 * editor.chain().focus().splitCell().run();
 * editor.chain().focus().mergeOrSplit().run();
 *
 * // Header operations
 * editor.chain().focus().toggleHeaderRow().run();
 * editor.chain().focus().toggleHeaderColumn().run();
 * editor.chain().focus().toggleHeaderCell().run();
 *
 * // Navigation
 * editor.chain().focus().goToNextCell().run();
 * editor.chain().focus().goToPreviousCell().run();
 *
 * // Cell selection
 * editor.chain().focus().setCellSelection({ anchorCell: 1, headCell: 2 }).run();
 *
 * // Fix table structure
 * editor.chain().focus().fixTables().run();
 * ```
 */
export function createVizelTableExtensions(options: VizelTableOptions = {}): Extensions {
  const { controls = true, ...tableOptions } = options;

  // Determine which Table extension to use
  const TableExtension = controls
    ? VizelTableWithControls.configure({
        resizable: tableOptions.resizable ?? false,
        cellMinWidth: tableOptions.cellMinWidth ?? 50,
        lastColumnResizable: tableOptions.lastColumnResizable ?? true,
        HTMLAttributes: {
          class: "vizel-table",
          ...tableOptions.tableHTMLAttributes,
        },
        // Pass control options (default to true if not explicitly set)
        showColumnInsert: typeof controls === "object" ? (controls.showColumnInsert ?? true) : true,
        showRowInsert: typeof controls === "object" ? (controls.showRowInsert ?? true) : true,
        showRowHandle: typeof controls === "object" ? (controls.showRowHandle ?? true) : true,
      })
    : VizelTable.configure({
        resizable: tableOptions.resizable ?? false,
        cellMinWidth: tableOptions.cellMinWidth ?? 50,
        lastColumnResizable: tableOptions.lastColumnResizable ?? true,
        HTMLAttributes: {
          class: "vizel-table",
          ...tableOptions.tableHTMLAttributes,
        },
      });

  return [
    TableExtension,
    TableRow.configure({
      HTMLAttributes: {
        class: "vizel-table-row",
      },
    }),
    VizelTableHeader.configure({
      HTMLAttributes: {
        class: "vizel-table-header",
        ...tableOptions.headerHTMLAttributes,
      },
    }),
    VizelTableCell.configure({
      HTMLAttributes: {
        class: "vizel-table-cell",
        ...tableOptions.cellHTMLAttributes,
      },
    }),
  ];
}

// Export extended extensions with textAlign and Markdown support
export { VizelTable, VizelTableCell, VizelTableHeader, type VizelTableCellAlignment };
