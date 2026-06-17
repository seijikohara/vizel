import type { Editor } from "@tiptap/core";
import type { TableOptions } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  renderVizelIcon,
  type VizelInternalIconName,
  type VizelTableIconName,
} from "../icons/types.ts";
import { VizelTable } from "./table-base";
import {
  findColumnBoundary,
  findHoveredColumn,
  findHoveredRow,
  findRowBoundary,
} from "./table-controls-geometry.ts";
import {
  getTablePosition,
  selectCellInColumn,
  selectCellInRow,
} from "./table-controls-selection.ts";

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

  // Compute cumulative row offsets so each row's start position is derived
  // without a running accumulator.
  const rowOffsets = Array.from({ length: table.childCount }, (_, idx) =>
    Array.from({ length: idx }, (_, j) => table.child(j).nodeSize).reduce(
      (sum, size) => sum + size,
      0
    )
  );

  // Mutate `tr` in place. `setNodeMarkup` returns the same transaction; we
  // forEach over rows and stage one mark per row.
  table.forEach((row, _, rowIdx) => {
    const rowStartPos = tablePos + 1 + (rowOffsets[rowIdx] ?? 0);
    const cellOffset = Array.from({ length: colIndex }, (_, j) => row.child(j).nodeSize).reduce(
      (sum, size) => sum + size,
      0
    );
    if (colIndex < 0 || colIndex >= row.childCount) return;
    const cellPos = rowStartPos + 1 + cellOffset;
    const cell = row.child(colIndex);
    tr.setNodeMarkup(cellPos, undefined, {
      ...cell.attrs,
      textAlign: alignment,
    });
  });

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

  // Cleanup function removes all listeners
  const cleanup = () => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target instanceof Node)) return;
    if (!menu.contains(e.target)) {
      cleanup();
      onClose();
    }
  };

  // Close on escape
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cleanup();
      onClose();
    }
  };

  // Delay adding click listener to avoid immediate close
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 0);
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

      // Menu / pointer-tracking state (held in a single closure-shared object
      // so multiple handlers can read and write without mutable bindings).
      const controlState: {
        activeMenu: HTMLElement | null;
        currentColumnBoundary: { index: number; position: number } | null;
        currentRowBoundary: { index: number; position: number } | null;
        currentHoveredRow: { index: number; element: HTMLTableRowElement } | null;
        currentHoveredColumn: { index: number; centerX: number } | null;
      } = {
        activeMenu: null,
        currentColumnBoundary: null,
        currentRowBoundary: null,
        currentHoveredRow: null,
        currentHoveredColumn: null,
      };

      const closeMenu = () => {
        if (controlState.activeMenu) {
          controlState.activeMenu.remove();
          controlState.activeMenu = null;
        }
      };

      // Column insert button handler
      const handleColumnInsert = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!editor.isEditable || controlState.currentColumnBoundary == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInColumn(editor, pos, Math.max(0, controlState.currentColumnBoundary.index - 1));

        if (controlState.currentColumnBoundary.index === 0) {
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

        if (!editor.isEditable || controlState.currentRowBoundary == null) return;

        const pos = getTablePosition(getPos, editor);
        if (pos == null) return;

        selectCellInRow(editor, pos, Math.max(0, controlState.currentRowBoundary.index - 1));

        if (controlState.currentRowBoundary.index === 0) {
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

        const hoveredRow = controlState.currentHoveredRow;
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
        controlState.activeMenu = menu;
      };

      // Use both mousedown and click for cross-browser compatibility
      // Store click handler references for proper cleanup
      const handleRowClick = (e: MouseEvent) => {
        // Prevent duplicate handling if mousedown already succeeded
        if (controlState.activeMenu) {
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

        const hoveredColumn = controlState.currentHoveredColumn;
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
        controlState.activeMenu = menu;
      };

      // Use both mousedown and click for cross-browser compatibility
      // Store click handler references for proper cleanup
      const handleColumnClick = (e: MouseEvent) => {
        // Prevent duplicate handling if mousedown already succeeded
        if (controlState.activeMenu) {
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
      const throttleState = { lastMoveTime: 0 };
      const THROTTLE_MS = 16; // ~60fps throttle

      // Helper to update column insert button position
      const updateColumnInsertPosition = (mouseX: number, tableRect: DOMRect) => {
        const boundary = findColumnBoundary(table, mouseX, tableRect);
        if (boundary) {
          controlState.currentColumnBoundary = boundary;
          columnInsertBtn.style.left = `${boundary.position + PADDING_LEFT_PX}px`;
          columnInsertBtn.style.top = "0px";
        } else if (!controlState.currentColumnBoundary) {
          controlState.currentColumnBoundary = { index: 0, position: 0 };
        }
      };

      // Helper to update row insert button position
      const updateRowInsertPosition = (mouseY: number, tableRect: DOMRect) => {
        const boundary = findRowBoundary(table, mouseY, tableRect);
        if (boundary) {
          controlState.currentRowBoundary = boundary;
          rowInsertBtn.style.left = "0px";
          rowInsertBtn.style.top = `${boundary.position + PADDING_TOP_PX}px`;
        } else if (!controlState.currentRowBoundary) {
          controlState.currentRowBoundary = { index: 0, position: 0 };
        }
      };

      // Helper to update row handle position
      const updateRowHandlePosition = (mouseY: number, tableRect: DOMRect) => {
        const hoveredRow = findHoveredRow(table, mouseY);
        if (hoveredRow) {
          controlState.currentHoveredRow = hoveredRow;
          const rowRect = hoveredRow.element.getBoundingClientRect();
          rowHandle.style.left = "2px";
          rowHandle.style.top = `${rowRect.top - tableRect.top + PADDING_TOP_PX + (rowRect.height - 20) / 2}px`;
        }
      };

      // Helper to update column handle position
      const updateColumnHandlePosition = (mouseX: number, tableRect: DOMRect) => {
        const hoveredColumn = findHoveredColumn(table, mouseX, tableRect);
        if (hoveredColumn) {
          controlState.currentHoveredColumn = hoveredColumn;
          columnHandle.style.left = `${hoveredColumn.centerX + PADDING_LEFT_PX}px`;
          columnHandle.style.top = "0px";
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!editor.isEditable) return;

        const now = Date.now();
        if (now - throttleState.lastMoveTime < THROTTLE_MS) return;
        throttleState.lastMoveTime = now;

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
          if (!(wrapper.matches(":hover") || controlState.activeMenu)) {
            controlState.currentColumnBoundary = null;
            controlState.currentRowBoundary = null;
            controlState.currentHoveredRow = null;
            controlState.currentHoveredColumn = null;
          }
        }, 100);
      };

      wrapper.addEventListener("mousemove", handleMouseMove);
      wrapper.addEventListener("mouseleave", handleMouseLeave);

      // Cell context menu (right-click) for cell-specific operations like alignment
      const handleContextMenu = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) return;
        const cell = e.target.closest("td, th");

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
        controlState.activeMenu = menu;
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

export type { VizelTableMenuItem };
export {
  CELL_MENU_ITEMS,
  COLUMN_MENU_ITEMS_BASE,
  createColumnMenuItems,
  ROW_MENU_ITEMS,
  VIZEL_TABLE_MENU_ITEMS,
};
