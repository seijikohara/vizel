import { resolveVizelGridNavigation } from "../utils/keyboard-navigation.ts";

/**
 * Options for {@link createVizelGridController}.
 */
export interface VizelGridControllerOptions {
  /** Returns the grid root element (or `null` before mount). */
  getRoot: () => HTMLElement | null;
  /** Number of columns per row. Required for two-dimensional traversal. */
  columns: number;
  /** Initial selected index in row-major order. Defaults to 0. */
  initialIndex?: number;
  /** Called with the next index whenever keyboard navigation changes the selection. */
  onChange: (index: number) => void;
  /**
   * CSS selector for the cells inside the root. Defaults to
   * `[role=gridcell]`, matching the canonical {@link VizelGridSpec}
   * shape.
   */
  itemSelector?: string;
}

/**
 * Returned by {@link createVizelGridController}.
 *
 * Mirrors the listbox controller's shape for consistency. `handleKey`
 * lets a parent listener forward events without `mount()`-ing.
 */
export interface VizelGridController {
  readonly mount: () => void;
  readonly unmount: () => void;
  readonly handleKey: (event: KeyboardEvent) => boolean;
  readonly getSelectedIndex: () => number;
  readonly setSelectedIndex: (index: number) => void;
}

/**
 * Build a controller for two-dimensional grid keyboard navigation.
 *
 * The controller wraps the pure {@link resolveVizelGridNavigation}
 * resolver with DOM-listener lifecycle management. `mount()` attaches
 * a `keydown` listener to the root element; `unmount()` removes it.
 * Both methods are idempotent and Server-Side Rendering (SSR) safe.
 *
 * Used by the color picker and other two-dimensional pickers that
 * follow the {@link VizelGridSpec} shape from `@vizel/core`.
 *
 * @example
 * ```tsx
 * const controller = createVizelGridController({
 *   getRoot: () => gridRef.current,
 *   columns: 8,
 *   onChange: setFocused,
 * });
 * controller.mount();
 * ```
 */
export function createVizelGridController(
  options: VizelGridControllerOptions
): VizelGridController {
  const {
    getRoot,
    columns,
    initialIndex = 0,
    onChange,
    itemSelector = "[role=gridcell]",
  } = options;

  const state = { selectedIndex: initialIndex, isMounted: false };

  const handleKey = (event: KeyboardEvent): boolean => {
    const root = getRoot();
    if (!root) return false;
    const items = root.querySelectorAll(itemSelector);
    const next = resolveVizelGridNavigation(event.key, state.selectedIndex, items.length, columns);
    if (next === null) return false;
    state.selectedIndex = next;
    onChange(state.selectedIndex);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (handleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return {
    mount: (): void => {
      if (typeof document === "undefined") return;
      if (state.isMounted) return;
      const root = getRoot();
      if (!root) return;
      root.addEventListener("keydown", handleKeyDown);
      state.isMounted = true;
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (!state.isMounted) return;
      getRoot()?.removeEventListener("keydown", handleKeyDown);
      state.isMounted = false;
    },
    handleKey,
    getSelectedIndex: () => state.selectedIndex,
    setSelectedIndex: (index: number) => {
      state.selectedIndex = index;
    },
  };
}
