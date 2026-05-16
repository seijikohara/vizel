/**
 * Pure keyboard navigation handler for an item list.
 *
 * Given the current focused index and the list length, returns the next
 * focused index for the supplied key. Returns `null` when the key is not
 * recognized (caller should let the event propagate).
 *
 * Handles ArrowUp/ArrowDown (wrap), Home/End. Tab is intentionally NOT
 * handled so callers can compose group-aware navigation on top.
 */
export function resolveVizelListNavigation(
  key: string,
  currentIndex: number,
  length: number
): number | null {
  if (length === 0) return null;
  switch (key) {
    case "ArrowDown":
      return (currentIndex + 1) % length;
    case "ArrowUp":
      return (currentIndex - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
}

/**
 * Pure keyboard navigation handler for a 2D grid.
 *
 * Handles ArrowUp/ArrowDown (row movement), ArrowLeft/ArrowRight (column
 * movement, with clamping at row edges), Home/End (jump to start/end of
 * the grid). Returns `null` when the key is not recognized.
 */
export function resolveVizelGridNavigation(
  key: string,
  currentIndex: number,
  length: number,
  columns: number
): number | null {
  if (length === 0 || columns <= 0) return null;
  const row = Math.floor(currentIndex / columns);
  const col = currentIndex % columns;
  switch (key) {
    case "ArrowRight":
      return Math.min(currentIndex + 1, length - 1);
    case "ArrowLeft":
      return Math.max(currentIndex - 1, 0);
    case "ArrowDown": {
      const next = currentIndex + columns;
      return next < length ? next : currentIndex;
    }
    case "ArrowUp":
      return row > 0 ? Math.max(0, (row - 1) * columns + col) : currentIndex;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
}
