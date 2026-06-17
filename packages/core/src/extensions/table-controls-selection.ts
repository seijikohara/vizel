/**
 * Table-controls cell selection and position lookup.
 *
 * Pure, DOM-free helpers: they compute ProseMirror document positions and
 * dispatch text selections through the editor. The table-controls
 * extension consumes them when a row / column control is activated.
 */

import type { Editor } from "@tiptap/core";

/**
 * Select the first cell in a specific row
 */
export function selectCellInRow(editor: Editor, tablePos: number, rowIndex: number): void {
  const { state } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;

  // Sum sizes of preceding rows to locate the requested row's start position.
  const startOffset = Array.from({ length: rowIndex }, (_, i) => table.child(i).nodeSize).reduce(
    (sum, size) => sum + size,
    0
  );
  if (rowIndex >= table.childCount) return;
  const rowStartPos = tablePos + 1 + startOffset;
  // Skip row node start then enter the first cell.
  const cellPos = rowStartPos + 1;
  editor
    .chain()
    .focus()
    .setTextSelection(cellPos + 1)
    .run();
}

/**
 * Select a cell in a specific column of the first row
 */
export function selectCellInColumn(editor: Editor, tablePos: number, colIndex: number): void {
  const { state } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table || table.childCount === 0) return;

  const firstRow = table.child(0);
  const targetIndex = colIndex > firstRow.childCount ? firstRow.childCount - 1 : colIndex;
  if (targetIndex < 0 || targetIndex >= firstRow.childCount) {
    // If colIndex is 0 (and clamping kept us here), select first cell.
    if (colIndex === 0 && firstRow.childCount > 0) {
      const firstCellPos = tablePos + 3;
      editor.chain().focus().setTextSelection(firstCellPos).run();
    }
    return;
  }

  // Sum sizes of preceding cells to locate the target cell's start position.
  const cellOffset = Array.from(
    { length: targetIndex },
    (_, i) => firstRow.child(i).nodeSize
  ).reduce((sum, size) => sum + size, 0);

  // Skip table node start and row node start, then accumulate cell sizes.
  const pos = tablePos + 2 + cellOffset;
  editor
    .chain()
    .focus()
    .setTextSelection(pos + 1)
    .run();
}

/**
 * Find table position from editor selection by walking up the document tree.
 * Used as fallback when getPos() returns undefined.
 */
function findTablePositionFromSelection(editor: Editor): number | undefined {
  try {
    const { selection } = editor.state;
    const resolved = selection.$from;
    for (let d = resolved.depth; d > 0; d--) {
      const node = resolved.node(d);
      if (node.type.name === "table") {
        return resolved.before(d);
      }
    }
  } catch {
    // Ignore errors in fallback
  }
  return undefined;
}

/**
 * Get table position from getPos function or fallback to selection-based lookup.
 */
export function getTablePosition(
  getPos: (() => number | undefined) | boolean,
  editor: Editor
): number | undefined {
  const fromGetPos = typeof getPos === "function" ? getPos() : undefined;
  return fromGetPos ?? findTablePositionFromSelection(editor);
}
