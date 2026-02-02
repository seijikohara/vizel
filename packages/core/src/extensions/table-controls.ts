import type { Editor } from "@tiptap/core";
import type { TableOptions } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  renderVizelIcon,
  type VizelInternalIconName,
  type VizelTableIconName,
} from "../icons/types.ts";
import { VizelTable } from "./table-base";

/**
 * Options for table controls UI (column/row insert buttons, row handle menu).
 */
export interface VizelTableControlsUIOptions {
  /**
   * Show column insert buttons on vertical border hover
   * @default true
   */
  showColumnInsert?: boolean;

  /**
   * Show row insert buttons on horizontal border hover
   * @default true
   */
  showRowInsert?: boolean;

  /**
   * Show row handle with edit menu on cell hover
   * @default true
   */
  showRowHandle?: boolean;
}

/**
 * Combined options for table with controls - extends Table's options with UI controls.
 */
export type VizelTableControlsOptions = Partial<TableOptions> & VizelTableControlsUIOptions;

interface VizelTableMenuItem {
  label: string;
  icon?: VizelTableIconName;
  command: string | ((editor: Editor) => void);
  destructive?: boolean;
  divider?: boolean;
}

/** Row-specific menu items (shown from row handle) */
const ROW_MENU_ITEMS: VizelTableMenuItem[] = [
  { label: "Add row above", icon: "arrowUp", command: "addRowBefore" },
  { label: "Add row below", icon: "arrowDown", command: "addRowAfter" },
  { label: "Delete row", command: "deleteRow", destructive: true },
  { divider: true, label: "", command: "" },
  { label: "Toggle header row", command: "toggleHeaderRow" },
  { divider: true, label: "", command: "" },
  { label: "Delete table", command: "deleteTable", destructive: true },
];

/** Base column menu items (without alignment - those are added dynamically) */
const COLUMN_MENU_ITEMS_BASE: VizelTableMenuItem[] = [
  { label: "Add column left", icon: "arrowLeft", command: "addColumnBefore" },
  { label: "Add column right", icon: "arrowRight", command: "addColumnAfter" },
  { label: "Delete column", command: "deleteColumn", destructive: true },
  { divider: true, label: "", command: "" },
  { label: "Toggle header column", command: "toggleHeaderColumn" },
];

/**
 * Create column menu items with alignment options bound to specific column
 */
function createColumnMenuItems(tablePos: number, colIndex: number): VizelTableMenuItem[] {
  return [
    ...COLUMN_MENU_ITEMS_BASE,
    { divider: true, label: "", command: "" },
    // Column-wide alignment (Markdown compatible)
    {
      label: "Align left",
      icon: "alignLeft",
      command: (editor) => setColumnAlignment(editor, tablePos, colIndex, "left"),
    },
    {
      label: "Align center",
      icon: "alignCenter",
      command: (editor) => setColumnAlignment(editor, tablePos, colIndex, "center"),
    },
    {
      label: "Align right",
      icon: "alignRight",
      command: (editor) => setColumnAlignment(editor, tablePos, colIndex, "right"),
    },
    { divider: true, label: "", command: "" },
    { label: "Delete table", command: "deleteTable", destructive: true },
  ];
}

/** Cell-specific menu items (shown from cell context menu) */
const CELL_MENU_ITEMS: VizelTableMenuItem[] = [
  // Cell operations only (alignment is now column-based for Markdown compatibility)
  { label: "Merge cells", command: "mergeCells" },
  { label: "Split cell", command: "splitCell" },
];

/** Threshold distance in pixels for detecting boundary hover */
const BOUNDARY_THRESHOLD_PX = 20;

/** Padding offset constants matching CSS (.vizel-table-controls-wrapper) */
const PADDING_TOP_PX = 20;
const PADDING_LEFT_PX = 24;

/** Combined menu items (legacy, for reference) */
const VIZEL_TABLE_MENU_ITEMS: VizelTableMenuItem[] = [
  ...ROW_MENU_ITEMS.slice(0, 3),
  { divider: true, label: "", command: "" },
  ...COLUMN_MENU_ITEMS_BASE.slice(0, 3),
  { divider: true, label: "", command: "" },
  ...CELL_MENU_ITEMS,
  { divider: true, label: "", command: "" },
  { label: "Delete table", command: "deleteTable", destructive: true },
];

/**
 * Find the column boundary index closest to the mouse X position
 */
function findColumnBoundary(
  tableElement: HTMLTableElement,
  mouseX: number,
  tableRect: DOMRect
): { index: number; position: number } | null {
  const firstRow = tableElement.querySelector("tr");
  if (!firstRow) return null;

  const cells = firstRow.querySelectorAll("td, th");
  if (cells.length === 0) return null;

  const boundaries: { index: number; position: number }[] = [];

  // Add left boundary (before first column)
  const firstCell = cells[0];
  if (!firstCell) return null;
  const firstCellRect = firstCell.getBoundingClientRect();
  boundaries.push({ index: 0, position: firstCellRect.left - tableRect.left });

  // Add boundaries between cells and after last cell
  cells.forEach((cell, i) => {
    const cellRect = cell.getBoundingClientRect();
    boundaries.push({ index: i + 1, position: cellRect.right - tableRect.left });
  });

  // Find closest boundary
  const relativeX = mouseX - tableRect.left;
  const firstBoundary = boundaries[0];
  if (!firstBoundary) return null;

  let closest = firstBoundary;
  let minDistance = Math.abs(relativeX - closest.position);

  for (const boundary of boundaries) {
    const distance = Math.abs(relativeX - boundary.position);
    if (distance < minDistance) {
      minDistance = distance;
      closest = boundary;
    }
  }

  // Only return if within threshold
  if (minDistance <= BOUNDARY_THRESHOLD_PX) {
    return closest;
  }

  return null;
}

/**
 * Find the row boundary index closest to the mouse Y position
 */
function findRowBoundary(
  tableElement: HTMLTableElement,
  mouseY: number,
  tableRect: DOMRect
): { index: number; position: number } | null {
  const rows = tableElement.querySelectorAll("tr");
  if (rows.length === 0) return null;

  const boundaries: { index: number; position: number }[] = [];

  // Add top boundary (before first row)
  const firstRow = rows[0];
  if (!firstRow) return null;
  const firstRowRect = firstRow.getBoundingClientRect();
  boundaries.push({ index: 0, position: firstRowRect.top - tableRect.top });

  // Add boundaries between rows and after last row
  rows.forEach((row, i) => {
    const rowRect = row.getBoundingClientRect();
    boundaries.push({ index: i + 1, position: rowRect.bottom - tableRect.top });
  });

  // Find closest boundary
  const relativeY = mouseY - tableRect.top;
  const firstBoundary = boundaries[0];
  if (!firstBoundary) return null;

  let closest = firstBoundary;
  let minDistance = Math.abs(relativeY - closest.position);

  for (const boundary of boundaries) {
    const distance = Math.abs(relativeY - boundary.position);
    if (distance < minDistance) {
      minDistance = distance;
      closest = boundary;
    }
  }

  // Only return if within threshold
  if (minDistance <= BOUNDARY_THRESHOLD_PX) {
    return closest;
  }

  return null;
}

/**
 * Find which row the mouse is hovering over
 */
function findHoveredRow(
  tableElement: HTMLTableElement,
  mouseY: number
): { index: number; element: HTMLTableRowElement } | null {
  const rows = tableElement.querySelectorAll("tr");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as HTMLTableRowElement;
    const rowRect = row.getBoundingClientRect();
    if (mouseY >= rowRect.top && mouseY <= rowRect.bottom) {
      return { index: i, element: row };
    }
  }

  return null;
}

/**
 * Find which column the mouse is hovering over
 */
function findHoveredColumn(
  tableElement: HTMLTableElement,
  mouseX: number,
  tableRect: DOMRect
): { index: number; centerX: number } | null {
  const firstRow = tableElement.querySelector("tr");
  if (!firstRow) return null;

  const cells = firstRow.querySelectorAll("td, th");
  if (cells.length === 0) return null;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i] as HTMLElement;
    const cellRect = cell.getBoundingClientRect();
    if (mouseX >= cellRect.left && mouseX <= cellRect.right) {
      // Return the center X position relative to the table
      const centerX = cellRect.left + cellRect.width / 2 - tableRect.left;
      return { index: i, centerX };
    }
  }

  return null;
}

/**
 * Select the first cell in a specific row
 */
function selectCellInRow(editor: Editor, tablePos: number, rowIndex: number): void {
  const { state } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;

  let pos = tablePos + 1; // Skip table node start
  for (let i = 0; i < table.childCount; i++) {
    const row = table.child(i);
    if (i === rowIndex) {
      // Select first cell in this row
      const cellPos = pos + 1; // Skip row node start
      editor
        .chain()
        .focus()
        .setTextSelection(cellPos + 1)
        .run();
      return;
    }
    pos += row.nodeSize;
  }
}

/**
 * Select a cell in a specific column of the first row
 */
function selectCellInColumn(editor: Editor, tablePos: number, colIndex: number): void {
  const { state } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table || table.childCount === 0) return;

  const firstRow = table.child(0);
  let pos = tablePos + 2; // Skip table node start and row node start

  for (let i = 0; i < firstRow.childCount; i++) {
    if (i === colIndex || (colIndex > firstRow.childCount && i === firstRow.childCount - 1)) {
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1)
        .run();
      return;
    }
    pos += firstRow.child(i).nodeSize;
  }

  // If colIndex is 0, select first cell
  if (colIndex === 0 && firstRow.childCount > 0) {
    const firstCellPos = tablePos + 3;
    editor.chain().focus().setTextSelection(firstCellPos).run();
  }
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
function getTablePosition(
  getPos: (() => number | undefined) | boolean,
  editor: Editor
): number | undefined {
  let pos = typeof getPos === "function" ? getPos() : undefined;
  if (pos === undefined) {
    pos = findTablePositionFromSelection(editor);
  }
  return pos;
}

/**
 * Set text alignment for all cells in a specific column (Markdown compatible)
 */
function setColumnAlignment(
  editor: Editor,
  tablePos: number,
  colIndex: number,
  alignment: "left" | "center" | "right"
): void {
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;

  const { tr } = state;
  let pos = tablePos + 1; // Skip table node start

  // Iterate through all rows
  for (let rowIdx = 0; rowIdx < table.childCount; rowIdx++) {
    const row = table.child(rowIdx);
    let cellPos = pos + 1; // Skip row node start

    // Find the cell at colIndex
    for (let cellIdx = 0; cellIdx < row.childCount; cellIdx++) {
      const cell = row.child(cellIdx);
      if (cellIdx === colIndex) {
        // Set textAlign attribute on this cell
        tr.setNodeMarkup(cellPos, undefined, {
          ...cell.attrs,
          textAlign: alignment,
        });
        break;
      }
      cellPos += cell.nodeSize;
    }

    pos += row.nodeSize;
  }

  view.dispatch(tr);
}

/**
 * Create the table menu element
 */
function createTableMenu(
  editor: Editor,
  onClose: () => void,
  menuItems: VizelTableMenuItem[] = VIZEL_TABLE_MENU_ITEMS
): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "vizel-table-menu";
  menu.setAttribute("data-vizel-table-menu", "");

  for (const item of menuItems) {
    if (item.divider) {
      const divider = document.createElement("div");
      divider.className = "vizel-table-menu-divider";
      menu.appendChild(divider);
      continue;
    }

    const button = document.createElement("button");
    button.className = "vizel-table-menu-item";
    if (item.destructive) {
      button.classList.add("is-destructive");
    }
    button.type = "button";

    if (item.icon) {
      const icon = document.createElement("span");
      icon.className = "vizel-table-menu-item-icon";
      // Render SVG icon instead of text
      icon.innerHTML = renderVizelIcon(item.icon as VizelInternalIconName, {
        width: 16,
        height: 16,
      });
      button.appendChild(icon);
    }

    const label = document.createElement("span");
    label.className = "vizel-table-menu-item-label";
    label.textContent = item.label;
    button.appendChild(label);

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (typeof item.command === "function") {
        item.command(editor);
      } else {
        const command = editor.commands[item.command as keyof typeof editor.commands];
        if (typeof command === "function") {
          (command as () => boolean)();
        }
      }

      onClose();
    });

    menu.appendChild(button);
  }

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      onClose();
      document.removeEventListener("click", handleClickOutside);
    }
  };

  // Delay adding listener to avoid immediate close
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 0);

  // Close on escape
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  return menu;
}

/**
 * VizelTableWithControls - Table extension with interactive controls
 */
export const VizelTableWithControls = VizelTable.extend<VizelTableControlsOptions>({
  name: "table",

  addOptions() {
    return {
      ...this.parent?.(),
      showColumnInsert: true,
      showRowInsert: true,
      showRowHandle: true,
    };
  },

  addNodeView() {
    return ({ editor, getPos }) => {
      const { showColumnInsert = true, showRowInsert = true, showRowHandle = true } = this.options;

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "vizel-table-controls-wrapper";
      wrapper.setAttribute("data-vizel-table-controls", "");

      // Create table element
      const table = document.createElement("table");
      table.className = "vizel-table";
      const tbody = document.createElement("tbody");
      table.appendChild(tbody);

      // Create column insert button (positioned in padding area above table)
      // CSS controls visibility via :hover on wrapper, JS only updates position
      // CSS uses transform: translateX(-50%) to center the button on its left position
      // Wrapper has padding: 24px left / 20px top, so button positions are relative to wrapper
      const columnInsertBtn = document.createElement("button");
      columnInsertBtn.className = "vizel-table-insert-button vizel-table-column-insert";
      columnInsertBtn.type = "button";
      columnInsertBtn.innerHTML = renderVizelIcon("plusSmall", { width: 10, height: 10 });
      columnInsertBtn.setAttribute("aria-label", "Insert column");
      columnInsertBtn.title = "Insert column";
      // Initial position at first column boundary (CSS translateX(-50%) centers it)
      columnInsertBtn.style.left = `${PADDING_LEFT_PX}px`;
      columnInsertBtn.style.top = "0px";

      // Create row insert button (positioned in padding area left of table)
      // CSS uses transform: translateY(-50%) to center the button on its top position
      const rowInsertBtn = document.createElement("button");
      rowInsertBtn.className = "vizel-table-insert-button vizel-table-row-insert";
      rowInsertBtn.type = "button";
      rowInsertBtn.innerHTML = renderVizelIcon("plusSmall", { width: 10, height: 10 });
      rowInsertBtn.setAttribute("aria-label", "Insert row");
      rowInsertBtn.title = "Insert row";
      // Initial position at first row boundary (CSS translateY(-50%) centers it)
      rowInsertBtn.style.left = "0px";
      rowInsertBtn.style.top = `${PADDING_TOP_PX}px`;

      // Create row handle (positioned in padding area left of table)
      // This handle opens a menu with row/column operations
      const rowHandle = document.createElement("button");
      rowHandle.className = "vizel-table-row-handle";
      rowHandle.type = "button";
      rowHandle.innerHTML = renderVizelIcon("grip", { width: 10, height: 10 });
      rowHandle.setAttribute("aria-label", "Table row options");
      rowHandle.title = "Row options (delete, align, etc.)";
      // Initial position at first row (in padding area)
      rowHandle.style.left = "2px";
      rowHandle.style.top = `${PADDING_TOP_PX + 12}px`;

      // Create column handle (positioned in padding area above table)
      // This handle opens a menu with column operations
      const columnHandle = document.createElement("button");
      columnHandle.className = "vizel-table-column-handle";
      columnHandle.type = "button";
      columnHandle.innerHTML = renderVizelIcon("gripHorizontal", { width: 10, height: 10 });
      columnHandle.setAttribute("aria-label", "Table column options");
      columnHandle.title = "Column options (delete, align, etc.)";
      // Initial position at first column (in padding area)
      columnHandle.style.left = "64px";
      columnHandle.style.top = "0px";

      // Menu state
      let activeMenu: HTMLElement | null = null;
      let currentColumnBoundary: { index: number; position: number } | null = null;
      let currentRowBoundary: { index: number; position: number } | null = null;
      let currentHoveredRow: { index: number; element: HTMLTableRowElement } | null = null;
      let currentHoveredColumn: { index: number; centerX: number } | null = null;

      const closeMenu = () => {
        if (activeMenu) {
          activeMenu.remove();
          activeMenu = null;
        }
      };

      // Column insert button handler
      const handleColumnInsert = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editor.isEditable || currentColumnBoundary == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInColumn(editor, pos, Math.max(0, currentColumnBoundary.index - 1));

        if (currentColumnBoundary.index === 0) {
          editor.chain().focus().addColumnBefore().run();
        } else {
          editor.chain().focus().addColumnAfter().run();
        }
      };

      columnInsertBtn.addEventListener("mousedown", handleColumnInsert);

      // Row insert button handler
      const handleRowInsert = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editor.isEditable || currentRowBoundary == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInRow(editor, pos, Math.max(0, currentRowBoundary.index - 1));

        if (currentRowBoundary.index === 0) {
          editor.chain().focus().addRowBefore().run();
        } else {
          editor.chain().focus().addRowAfter().run();
        }
      };

      rowInsertBtn.addEventListener("mousedown", handleRowInsert);

      // Row handle click handler
      const handleRowHandleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const hoveredRow = currentHoveredRow;
        if (!editor.isEditable || hoveredRow == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInRow(editor, pos, hoveredRow.index);
        closeMenu();

        const menu = createTableMenu(editor, closeMenu, ROW_MENU_ITEMS);
        const handleRect = rowHandle.getBoundingClientRect();
        menu.style.position = "fixed";
        menu.style.left = `${handleRect.right + 4}px`;
        menu.style.top = `${handleRect.top}px`;

        document.body.appendChild(menu);
        activeMenu = menu;
      };

      // Use both mousedown and click for cross-browser compatibility
      // Store click handler references for proper cleanup
      const handleRowClick = (e: MouseEvent) => {
        // Prevent duplicate handling if mousedown already succeeded
        if (activeMenu) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      rowHandle.addEventListener("mousedown", handleRowHandleClick);
      rowHandle.addEventListener("click", handleRowClick);

      // Column handle click handler
      const handleColumnHandleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const hoveredColumn = currentHoveredColumn;
        if (!editor.isEditable || hoveredColumn == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInColumn(editor, pos, hoveredColumn.index);
        closeMenu();

        const columnMenuItems = createColumnMenuItems(pos, hoveredColumn.index);
        const menu = createTableMenu(editor, closeMenu, columnMenuItems);
        const handleRect = columnHandle.getBoundingClientRect();
        menu.style.position = "fixed";
        menu.style.left = `${handleRect.left}px`;
        menu.style.top = `${handleRect.bottom + 4}px`;

        document.body.appendChild(menu);
        activeMenu = menu;
      };

      // Use both mousedown and click for cross-browser compatibility
      // Store click handler references for proper cleanup
      const handleColumnClick = (e: MouseEvent) => {
        // Prevent duplicate handling if mousedown already succeeded
        if (activeMenu) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      columnHandle.addEventListener("mousedown", handleColumnHandleClick);
      columnHandle.addEventListener("click", handleColumnClick);

      // Mouse move handler for showing/hiding controls
      // Note: We process synchronously instead of using RAF because React may re-render
      // and replace the DOM elements before RAF callbacks execute. This ensures the
      // button visibility is updated immediately when the mouse moves.
      let lastMoveTime = 0;
      const THROTTLE_MS = 16; // ~60fps throttle

      // Helper to update column insert button position
      const updateColumnInsertPosition = (mouseX: number, tableRect: DOMRect) => {
        const boundary = findColumnBoundary(table, mouseX, tableRect);
        if (boundary) {
          currentColumnBoundary = boundary;
          columnInsertBtn.style.left = `${boundary.position + PADDING_LEFT_PX}px`;
          columnInsertBtn.style.top = "0px";
        } else if (!currentColumnBoundary) {
          currentColumnBoundary = { index: 0, position: 0 };
        }
      };

      // Helper to update row insert button position
      const updateRowInsertPosition = (mouseY: number, tableRect: DOMRect) => {
        const boundary = findRowBoundary(table, mouseY, tableRect);
        if (boundary) {
          currentRowBoundary = boundary;
          rowInsertBtn.style.left = "0px";
          rowInsertBtn.style.top = `${boundary.position + PADDING_TOP_PX}px`;
        } else if (!currentRowBoundary) {
          currentRowBoundary = { index: 0, position: 0 };
        }
      };

      // Helper to update row handle position
      const updateRowHandlePosition = (mouseY: number, tableRect: DOMRect) => {
        const hoveredRow = findHoveredRow(table, mouseY);
        if (hoveredRow) {
          currentHoveredRow = hoveredRow;
          const rowRect = hoveredRow.element.getBoundingClientRect();
          rowHandle.style.left = "2px";
          rowHandle.style.top = `${rowRect.top - tableRect.top + PADDING_TOP_PX + (rowRect.height - 20) / 2}px`;
        }
      };

      // Helper to update column handle position
      const updateColumnHandlePosition = (mouseX: number, tableRect: DOMRect) => {
        const hoveredColumn = findHoveredColumn(table, mouseX, tableRect);
        if (hoveredColumn) {
          currentHoveredColumn = hoveredColumn;
          columnHandle.style.left = `${hoveredColumn.centerX + PADDING_LEFT_PX}px`;
          columnHandle.style.top = "0px";
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!editor.isEditable) return;

        const now = Date.now();
        if (now - lastMoveTime < THROTTLE_MS) return;
        lastMoveTime = now;

        const tableRect = table.getBoundingClientRect();
        const isInTable =
          e.clientX >= tableRect.left &&
          e.clientX <= tableRect.right &&
          e.clientY >= tableRect.top &&
          e.clientY <= tableRect.bottom;

        if (showColumnInsert) updateColumnInsertPosition(e.clientX, tableRect);
        if (showRowInsert) updateRowInsertPosition(e.clientY, tableRect);

        if (showRowHandle && isInTable) {
          updateRowHandlePosition(e.clientY, tableRect);
          updateColumnHandlePosition(e.clientX, tableRect);
        }
      };

      const handleMouseLeave = () => {
        // CSS controls visibility via :hover, so we just reset state variables
        // Delay to allow clicking on buttons that might extend outside wrapper
        setTimeout(() => {
          if (!(wrapper.matches(":hover") || activeMenu)) {
            currentColumnBoundary = null;
            currentRowBoundary = null;
            currentHoveredRow = null;
            currentHoveredColumn = null;
          }
        }, 100);
      };

      wrapper.addEventListener("mousemove", handleMouseMove);
      wrapper.addEventListener("mouseleave", handleMouseLeave);

      // Cell context menu (right-click) for cell-specific operations like alignment
      const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const cell = target.closest("td, th");

        if (!(cell && editor.isEditable)) return;

        e.preventDefault();
        e.stopPropagation();

        // Click in the cell to set selection
        const cellRect = cell.getBoundingClientRect();
        const cellCenterX = cellRect.left + cellRect.width / 2;
        const cellCenterY = cellRect.top + cellRect.height / 2;

        // Dispatch a click event to set the cursor in the cell
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: cellCenterX,
          clientY: cellCenterY,
          view: window,
        });
        cell.dispatchEvent(clickEvent);

        closeMenu();

        // Show cell-specific menu
        const menu = createTableMenu(editor, closeMenu, CELL_MENU_ITEMS);
        menu.style.position = "fixed";
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        document.body.appendChild(menu);
        activeMenu = menu;
      };

      table.addEventListener("contextmenu", handleContextMenu);

      // Append elements
      wrapper.appendChild(columnInsertBtn);
      wrapper.appendChild(rowInsertBtn);
      wrapper.appendChild(rowHandle);
      wrapper.appendChild(columnHandle);
      wrapper.appendChild(table);

      return {
        dom: wrapper,
        contentDOM: tbody,
        update: (updatedNode: ProseMirrorNode) => {
          if (updatedNode.type.name !== "table") return false;
          return true;
        },
        // Ignore mutations in the wrapper that are not in the content area (tbody)
        // This prevents ProseMirror from re-rendering when buttons are manipulated
        ignoreMutation: (mutation: { target: Node; type: string }) => {
          const target = mutation.target;
          const isInsideWrapper = wrapper.contains(target);
          const isInsideContent = tbody.contains(target);

          // Ignore mutations inside wrapper but outside content (i.e., button/control area)
          if (isInsideWrapper && !isInsideContent) {
            return true;
          }
          return false;
        },
        destroy: () => {
          wrapper.removeEventListener("mousemove", handleMouseMove);
          wrapper.removeEventListener("mouseleave", handleMouseLeave);
          table.removeEventListener("contextmenu", handleContextMenu);
          columnInsertBtn.removeEventListener("mousedown", handleColumnInsert);
          rowInsertBtn.removeEventListener("mousedown", handleRowInsert);
          rowHandle.removeEventListener("mousedown", handleRowHandleClick);
          rowHandle.removeEventListener("click", handleRowClick);
          columnHandle.removeEventListener("mousedown", handleColumnHandleClick);
          columnHandle.removeEventListener("click", handleColumnClick);
          closeMenu();
        },
      };
    };
  },
});

export {
  VIZEL_TABLE_MENU_ITEMS,
  ROW_MENU_ITEMS,
  COLUMN_MENU_ITEMS_BASE,
  CELL_MENU_ITEMS,
  createColumnMenuItems,
};
export type { VizelTableMenuItem };
