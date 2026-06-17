/**
 * Table-controls boundary and hover geometry.
 *
 * Pure DOM-measurement helpers: they read element rectangles via
 * `getBoundingClientRect` but never mutate the DOM. The table-controls
 * extension consumes them to position the row / column overlays.
 */

/** Threshold distance in pixels for detecting boundary hover */
const BOUNDARY_THRESHOLD_PX = 20;

/**
 * Find the column boundary index closest to the mouse X position
 */
export function findColumnBoundary(
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

  const { closest, minDistance } = boundaries.reduce(
    (acc, boundary) => {
      const distance = Math.abs(relativeX - boundary.position);
      return distance < acc.minDistance ? { closest: boundary, minDistance: distance } : acc;
    },
    { closest: firstBoundary, minDistance: Math.abs(relativeX - firstBoundary.position) }
  );

  // Only return if within threshold
  return minDistance <= BOUNDARY_THRESHOLD_PX ? closest : null;
}

/**
 * Find the row boundary index closest to the mouse Y position
 */
export function findRowBoundary(
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

  const { closest, minDistance } = boundaries.reduce(
    (acc, boundary) => {
      const distance = Math.abs(relativeY - boundary.position);
      return distance < acc.minDistance ? { closest: boundary, minDistance: distance } : acc;
    },
    { closest: firstBoundary, minDistance: Math.abs(relativeY - firstBoundary.position) }
  );

  // Only return if within threshold
  return minDistance <= BOUNDARY_THRESHOLD_PX ? closest : null;
}

/**
 * Find which row the mouse is hovering over
 */
export function findHoveredRow(
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
export function findHoveredColumn(
  tableElement: HTMLTableElement,
  mouseX: number,
  tableRect: DOMRect
): { index: number; centerX: number } | null {
  const firstRow = tableElement.querySelector("tr");
  if (!firstRow) return null;

  const cells = firstRow.querySelectorAll("td, th");
  if (cells.length === 0) return null;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (!(cell instanceof HTMLElement)) continue;
    const cellRect = cell.getBoundingClientRect();
    if (mouseX >= cellRect.left && mouseX <= cellRect.right) {
      // Return the center X position relative to the table
      const centerX = cellRect.left + cellRect.width / 2 - tableRect.left;
      return { index: i, centerX };
    }
  }

  return null;
}
