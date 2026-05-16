import { resolveVizelListNavigation } from "../utils/keyboard-navigation.ts";

/**
 * Options for {@link createVizelListboxController}.
 */
export interface VizelListboxControllerOptions {
  /** Returns the listbox root element (or `null` before mount). */
  getRoot: () => HTMLElement | null;
  /** Initial selected index. Defaults to 0. */
  initialIndex?: number;
  /** Called with the next index whenever keyboard navigation changes the selection. */
  onChange: (index: number) => void;
  /**
   * CSS selector for the items inside the root. Defaults to
   * `[role=option]`, matching the canonical {@link VizelMenuSpec}
   * listbox shape.
   */
  itemSelector?: string;
}

/**
 * Returned by {@link createVizelListboxController}.
 *
 * Follows the canonical controller contract. The `handleKey` escape
 * hatch exists for cases where a parent owns the `keydown` listener
 * (for example a Tiptap suggestion renderer that forwards events) and
 * the controller is mounted only for the selection state.
 */
export interface VizelListboxController {
  /** Attach the `keydown` listener to the root element. */
  readonly mount: () => void;
  /** Detach the listener. Idempotent. */
  readonly unmount: () => void;
  /**
   * Forward a single `KeyboardEvent` and apply the resulting navigation
   * if any. Returns `true` when the event was consumed (the caller
   * should `event.preventDefault()` themselves) and `false` otherwise.
   */
  readonly handleKey: (event: KeyboardEvent) => boolean;
  /** Read the current selected index. */
  readonly getSelectedIndex: () => number;
  /** Set the selected index directly (e.g. when an item is clicked). */
  readonly setSelectedIndex: (index: number) => void;
}

/**
 * Build a controller for a one-dimensional listbox keyboard navigation.
 *
 * The controller wraps the pure {@link resolveVizelListNavigation}
 * resolver with DOM-listener lifecycle management. `mount()` attaches
 * a `keydown` listener to the root element returned by `getRoot`;
 * `unmount()` removes it. Both methods are idempotent and
 * Server-Side Rendering (SSR) safe.
 *
 * The pure resolver remains exported from `utils/keyboard-navigation`
 * for callers that want to handle key events themselves (the mention
 * menu, suggestion renderers, etc.).
 *
 * @example
 * ```tsx
 * // React adapter:
 * const rootRef = useRef<HTMLDivElement>(null);
 * const [selected, setSelected] = useState(0);
 * useEffect(() => {
 *   const controller = createVizelListboxController({
 *     getRoot: () => rootRef.current,
 *     onChange: setSelected,
 *   });
 *   controller.mount();
 *   return () => controller.unmount();
 * }, []);
 * ```
 */
export function createVizelListboxController(
  options: VizelListboxControllerOptions
): VizelListboxController {
  const { getRoot, initialIndex = 0, onChange, itemSelector = "[role=option]" } = options;

  let selectedIndex = initialIndex;
  let isMounted = false;

  const handleKey = (event: KeyboardEvent): boolean => {
    const root = getRoot();
    if (!root) return false;
    const items = root.querySelectorAll(itemSelector);
    const next = resolveVizelListNavigation(event.key, selectedIndex, items.length);
    if (next === null) return false;
    selectedIndex = next;
    onChange(selectedIndex);
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
      if (isMounted) return;
      const root = getRoot();
      if (!root) return;
      root.addEventListener("keydown", handleKeyDown);
      isMounted = true;
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (!isMounted) return;
      getRoot()?.removeEventListener("keydown", handleKeyDown);
      isMounted = false;
    },
    handleKey,
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: (index: number) => {
      selectedIndex = index;
    },
  };
}
