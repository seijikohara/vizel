/**
 * Keyboard navigation primitive.
 *
 * Provides the roving-selection logic every Vizel listbox and grid
 * surface needs: arrow-key movement, Home/End jumps, and (for lists)
 * wraparound. The module ships two pure spec builders and two
 * controllers. This logic lives in `@vizel/headless` rather than each
 * adapter so the three adapters share one implementation; the
 * DOM-listener variants follow the
 * `{ mount, unmount, update }` contract.
 *
 * `buildVizelListNavSpec` and `buildVizelGridNavSpec` are pure: they
 * read a key plus the current selection geometry and return the next
 * index, or `null` when the key is unhandled. Adapter components that
 * own their own `keydown` listener (a Tiptap suggestion renderer, a
 * React/Vue/Svelte menu) call the builder directly. Surfaces that want
 * the controller to own the listener use
 * `createVizelKeyboardListController` / `createVizelKeyboardGridController`.
 */

/**
 * Input geometry for one-dimensional list navigation.
 */
export interface VizelListNavInput {
  /** The pressed key, taken from `KeyboardEvent.key`. */
  readonly key: string;
  /** The current selected index. */
  readonly currentIndex: number;
  /** The number of items in the list. */
  readonly length: number;
}

/**
 * Input geometry for two-dimensional grid navigation.
 */
export interface VizelGridNavInput {
  /** The pressed key, taken from `KeyboardEvent.key`. */
  readonly key: string;
  /** The current selected index in row-major order. */
  readonly currentIndex: number;
  /** The number of cells in the grid. */
  readonly length: number;
  /** The number of columns per row. */
  readonly columns: number;
}

const isBrowser = (): boolean => typeof document !== "undefined";

/**
 * Return the next selected index for a one-dimensional list, or `null`
 * when the key does not drive list navigation.
 *
 * ArrowDown and ArrowUp wrap around the list edges; Home and End jump
 * to the first and last item. The function returns `null` for any other
 * key and for an empty list, so callers let the unhandled key propagate
 * (for example, to the editor's own keymap) instead of writing a `NaN`
 * index. Tab is intentionally unhandled so callers compose group-aware
 * navigation on top.
 *
 * @example
 * ```ts
 * const next = buildVizelListNavSpec({ key: "ArrowDown", currentIndex: 2, length: 3 });
 * // next === 0 (wraps to the start)
 * ```
 */
export function buildVizelListNavSpec(input: VizelListNavInput): number | null {
  const { key, currentIndex, length } = input;
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
 * Return the next selected index for a two-dimensional grid, or `null`
 * when the key does not drive grid navigation.
 *
 * ArrowRight and ArrowLeft move one cell in row-major order and clamp at
 * the grid edges. ArrowDown and ArrowUp move one row and stay on the
 * current cell when the move would leave the grid. Home and End jump to
 * the first and last cell. The function returns `null` for any other key,
 * for an empty grid, and for a non-positive column count.
 *
 * @example
 * ```ts
 * const next = buildVizelGridNavSpec({
 *   key: "ArrowDown",
 *   currentIndex: 1,
 *   length: 8,
 *   columns: 4,
 * });
 * // next === 5 (one row down)
 * ```
 */
export function buildVizelGridNavSpec(input: VizelGridNavInput): number | null {
  const { key, currentIndex, length, columns } = input;
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

/**
 * Options for {@link createVizelKeyboardListController}.
 */
export interface VizelKeyboardListControllerOptions {
  /** Return the listbox root element, or `null` before mount. */
  readonly getRoot: () => HTMLElement | null;
  /** The initial selected index. Defaults to 0. */
  readonly initialIndex?: number;
  /**
   * Fires with the next index whenever keyboard navigation moves the
   * selection.
   */
  readonly onChange: (index: number) => void;
  /**
   * CSS selector for the items inside the root. Defaults to
   * `[role=option]`, matching the canonical Vizel listbox shape.
   */
  readonly itemSelector?: string;
}

/**
 * Options for {@link createVizelKeyboardGridController}.
 */
export interface VizelKeyboardGridControllerOptions {
  /** Return the grid root element, or `null` before mount. */
  readonly getRoot: () => HTMLElement | null;
  /** The number of columns per row. Required for grid traversal. */
  readonly columns: number;
  /** The initial selected index in row-major order. Defaults to 0. */
  readonly initialIndex?: number;
  /**
   * Fires with the next index whenever keyboard navigation moves the
   * selection.
   */
  readonly onChange: (index: number) => void;
  /**
   * CSS selector for the cells inside the root. Defaults to
   * `[role=gridcell]`, matching the canonical Vizel grid shape.
   */
  readonly itemSelector?: string;
}

/**
 * Shared controller contract for keyboard list and grid navigation.
 *
 * `mount` attaches a `keydown` listener to the root element; `unmount`
 * detaches it. Both methods are idempotent and Server-Side Rendering
 * (SSR) safe. The `handleKey` escape hatch exists for cases where a
 * parent owns the `keydown` listener (for example a Tiptap suggestion
 * renderer that forwards events) and the controller tracks only the
 * selection state.
 */
export interface VizelKeyboardController {
  /** Attach the `keydown` listener to the root element. */
  mount(): void;
  /** Detach the listener. Calling `unmount` more than once is a no-op. */
  unmount(): void;
  /**
   * Forward a single `KeyboardEvent` and apply the resulting navigation,
   * if any. Returns `true` when the controller consumed the event (the
   * caller calls `event.preventDefault()` themselves) and `false`
   * otherwise.
   */
  handleKey(event: KeyboardEvent): boolean;
  /** Read the current selected index. */
  getSelectedIndex(): number;
  /** Set the selected index directly, for example when an item is clicked. */
  setSelectedIndex(index: number): void;
}

/**
 * Construct a controller for one-dimensional listbox keyboard
 * navigation.
 *
 * The controller wraps the pure {@link buildVizelListNavSpec} resolver
 * with `keydown`-listener lifecycle management. Adapter code obtains the
 * controller through `@vizel/headless`, returns its root element from
 * `getRoot`, calls `mount` inside the framework's lifecycle hook, and
 * detaches via `unmount` on teardown.
 *
 * @example
 * ```ts
 * const controller = createVizelKeyboardListController({
 *   getRoot: () => rootRef.current,
 *   onChange: setSelectedIndex,
 * });
 * controller.mount();
 * // teardown: controller.unmount();
 * ```
 */
export function createVizelKeyboardListController(
  options: VizelKeyboardListControllerOptions
): VizelKeyboardController {
  const state = {
    selectedIndex: options.initialIndex ?? 0,
    isMounted: false,
  };
  const itemSelector = options.itemSelector ?? "[role=option]";

  const handleKey = (event: KeyboardEvent): boolean => {
    const root = options.getRoot();
    if (!root) return false;
    const length = root.querySelectorAll(itemSelector).length;
    const next = buildVizelListNavSpec({
      key: event.key,
      currentIndex: state.selectedIndex,
      length,
    });
    if (next === null) return false;
    state.selectedIndex = next;
    options.onChange(next);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (handleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return {
    mount(): void {
      if (!isBrowser()) return;
      if (state.isMounted) return;
      const root = options.getRoot();
      if (!root) return;
      root.addEventListener("keydown", handleKeyDown);
      state.isMounted = true;
    },
    unmount(): void {
      if (!isBrowser()) return;
      if (!state.isMounted) return;
      options.getRoot()?.removeEventListener("keydown", handleKeyDown);
      state.isMounted = false;
    },
    handleKey,
    getSelectedIndex: () => state.selectedIndex,
    setSelectedIndex: (index: number): void => {
      state.selectedIndex = index;
    },
  };
}

/**
 * Construct a controller for two-dimensional grid keyboard navigation.
 *
 * The controller wraps the pure {@link buildVizelGridNavSpec} resolver
 * with `keydown`-listener lifecycle management and mirrors the list
 * controller's shape. A color picker and other grid pickers consume it.
 *
 * @example
 * ```ts
 * const controller = createVizelKeyboardGridController({
 *   getRoot: () => gridRef.current,
 *   columns: 8,
 *   onChange: setFocusedIndex,
 * });
 * controller.mount();
 * ```
 */
export function createVizelKeyboardGridController(
  options: VizelKeyboardGridControllerOptions
): VizelKeyboardController {
  const state = {
    selectedIndex: options.initialIndex ?? 0,
    isMounted: false,
  };
  const itemSelector = options.itemSelector ?? "[role=gridcell]";

  const handleKey = (event: KeyboardEvent): boolean => {
    const root = options.getRoot();
    if (!root) return false;
    const length = root.querySelectorAll(itemSelector).length;
    const next = buildVizelGridNavSpec({
      key: event.key,
      currentIndex: state.selectedIndex,
      length,
      columns: options.columns,
    });
    if (next === null) return false;
    state.selectedIndex = next;
    options.onChange(next);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (handleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return {
    mount(): void {
      if (!isBrowser()) return;
      if (state.isMounted) return;
      const root = options.getRoot();
      if (!root) return;
      root.addEventListener("keydown", handleKeyDown);
      state.isMounted = true;
    },
    unmount(): void {
      if (!isBrowser()) return;
      if (!state.isMounted) return;
      options.getRoot()?.removeEventListener("keydown", handleKeyDown);
      state.isMounted = false;
    },
    handleKey,
    getSelectedIndex: () => state.selectedIndex,
    setSelectedIndex: (index: number): void => {
      state.selectedIndex = index;
    },
  };
}
