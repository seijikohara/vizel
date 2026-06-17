/**
 * Combobox primitive.
 *
 * Resolves the keyboard contract shared by every Vizel autocomplete-style
 * menu — the slash menu and the mention menu — and supplies the
 * `aria-activedescendant` / `aria-expanded` wiring the WAI-ARIA combobox
 * pattern requires. Combobox is the primitive that backs typeahead and
 * roving-tabindex menus; this module is the last entry in the headless
 * catalogue.
 *
 * The module composes the keyboard primitive rather than re-deriving
 * navigation: {@link buildVizelComboboxKeySpec} delegates the arrow / Home
 * / End geometry to {@link buildVizelListNavSpec} and only adds the
 * combobox-specific verbs (select, close, group-next). The DOM-touching
 * variant follows the
 * `{ mount, unmount, update }` contract.
 *
 * A Vizel suggestion menu does not own its `keydown` listener: a Tiptap
 * suggestion renderer forwards each raw `KeyboardEvent` through an
 * `onKeyDown(event): boolean` handle. Those menus consume the pure
 * {@link buildVizelComboboxKeySpec} resolver directly.
 * {@link createVizelComboboxController} exists for surfaces that do own the
 * listener and want the ARIA wiring managed for them; it completes the
 * primitive's `{ buildSpec, createController }` shape.
 */

import {
  buildVizelListNavSpec,
  createVizelKeyboardListController,
  type VizelKeyboardController,
  type VizelKeyboardListControllerOptions,
} from "../keyboard/index.ts";

const isBrowser = (): boolean => typeof document !== "undefined";

/**
 * Input geometry for the combobox key resolver.
 *
 * The shape mirrors {@link VizelListNavInput} so a caller forwards the same
 * `{ key, currentIndex, length }` triple it already computes for list
 * navigation.
 */
export interface VizelComboboxKeyInput {
  /** The pressed key, taken from `KeyboardEvent.key`. */
  readonly key: string;
  /** The current selected index. */
  readonly currentIndex: number;
  /** The number of items in the menu. */
  readonly length: number;
}

/**
 * Action a combobox surface performs in response to a key.
 *
 * The discriminated union lets a caller `switch` on `type` and map each
 * verb to its own state update:
 *
 * - `navigate` — move the keyboard selection to `index` (arrow / Home /
 *   End, computed by {@link buildVizelListNavSpec}, so it wraps at the
 *   edges).
 * - `select` — activate the item at `index` (Enter).
 * - `close` — dismiss the surface (Escape).
 * - `groupNext` — jump to the next group. The resolver does not know the
 *   feature-specific next-group index, so the caller computes it (the
 *   slash menu uses `getNextVizelSlashMenuGroupIndex`; the mention menu
 *   has no groups and treats the verb as unhandled).
 */
export type VizelComboboxAction =
  | { readonly type: "navigate"; readonly index: number }
  | { readonly type: "select"; readonly index: number }
  | { readonly type: "close" }
  | { readonly type: "groupNext" };

/**
 * Resolve a key press to a {@link VizelComboboxAction}, or `null` when the
 * combobox does not handle the key.
 *
 * The resolver is pure and Server-Side Rendering (SSR) safe. It returns
 * `null` for an empty menu (`length === 0`) regardless of the key, so an
 * open-but-empty suggestion menu lets the editor consume Enter, Tab, and
 * the arrows instead of swallowing them — matching the behaviour each
 * adapter menu shipped before adopting this primitive.
 *
 * Arrow keys plus Home and End delegate to {@link buildVizelListNavSpec};
 * the resolver wraps that result in a `navigate` action. Enter selects the
 * current index, Escape closes, and Tab requests the next group. Any other
 * key returns `null`.
 *
 * @example
 * ```ts
 * const action = buildVizelComboboxKeySpec({ key: "ArrowDown", currentIndex: 2, length: 3 });
 * // action === { type: "navigate", index: 0 } (wraps to the start)
 * ```
 */
export function buildVizelComboboxKeySpec(
  input: VizelComboboxKeyInput
): VizelComboboxAction | null {
  const { key, currentIndex, length } = input;
  // An empty menu hands every key back to the caller (and thence to
  // Tiptap). Returning early keeps the no-results state inert.
  if (length === 0) return null;

  const navIndex = buildVizelListNavSpec({ key, currentIndex, length });
  if (navIndex !== null) return { type: "navigate", index: navIndex };

  switch (key) {
    case "Enter":
      return { type: "select", index: currentIndex };
    case "Escape":
      return { type: "close" };
    case "Tab":
      return { type: "groupNext" };
    default:
      return null;
  }
}

/**
 * Options for {@link createVizelComboboxController}.
 *
 * The shape extends {@link VizelKeyboardListControllerOptions} so the
 * controller reuses the keyboard primitive's root accessor, item selector,
 * initial index, and `onChange` callback, then adds the combobox-specific
 * owner accessor and activation callbacks.
 */
export interface VizelComboboxControllerOptions extends VizelKeyboardListControllerOptions {
  /**
   * Return the element that carries `aria-expanded` (typically the input or
   * trigger that owns the listbox), or `null` when the surface has none. The
   * controller sets `aria-expanded="true"` on mount and removes it on
   * unmount.
   */
  readonly getOwner?: () => HTMLElement | null;
  /** Fires with the item index when Enter selects an option. */
  readonly onSelect?: (index: number) => void;
  /** Fires when Escape requests dismissal. */
  readonly onClose?: () => void;
}

/**
 * Returned by {@link createVizelComboboxController}.
 *
 * The controller extends the keyboard controller contract (`mount`,
 * `unmount`, `handleKey`, `getSelectedIndex`, `setSelectedIndex`) with an
 * `update(selectedIndex)` method that re-points `aria-activedescendant`
 * after an external selection change.
 */
export interface VizelComboboxController extends VizelKeyboardController {
  /**
   * Sync `aria-activedescendant` to the option at `selectedIndex`. Call
   * after a click or any state change that moves the selection outside the
   * controller's own key handling.
   */
  update(selectedIndex: number): void;
}

/**
 * Return the `[role=option]` elements under `root` in document order.
 *
 * The query matches the canonical Vizel listbox shape; the result drives
 * both the deterministic id assignment and the `aria-activedescendant`
 * lookup.
 */
const collectOptions = (root: HTMLElement, itemSelector: string): readonly HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(itemSelector));

/**
 * Construct a combobox controller that owns the `keydown` listener and the
 * combobox ARIA wiring.
 *
 * The controller composes {@link createVizelKeyboardListController} for the
 * navigation state and listener lifecycle, then layers three concerns on
 * top:
 *
 * 1. **Selection and dismissal.** A wrapped key handler maps Enter to
 *    `onSelect(index)` and Escape to `onClose()` before delegating arrow /
 *    Home / End to the keyboard controller.
 * 2. **`aria-expanded`.** `mount` sets `aria-expanded="true"` on the
 *    `getOwner` element; `unmount` removes the attribute.
 * 3. **`aria-activedescendant`.** `mount` and `update` assign a
 *    deterministic id to any option lacking one, then point the root's
 *    `aria-activedescendant` at the active option's id.
 *
 * Every DOM method opens with an SSR guard, and `mount` / `unmount` are
 * idempotent.
 *
 * @example
 * ```ts
 * const combobox = createVizelComboboxController({
 *   getRoot: () => listboxRef.current,
 *   getOwner: () => inputRef.current,
 *   onChange: setSelectedIndex,
 *   onSelect: selectItem,
 *   onClose: closeMenu,
 * });
 * combobox.mount();
 * // teardown: combobox.unmount();
 * ```
 */
export function createVizelComboboxController(
  options: VizelComboboxControllerOptions
): VizelComboboxController {
  const itemSelector = options.itemSelector ?? "[role=option]";
  const state = {
    isMounted: false,
    // Monotonic suffix so each generated option id stays unique within the
    // controller instance even as the option list re-renders.
    idCounter: 0,
  };

  const keyboard = createVizelKeyboardListController(options);

  const syncActiveDescendant = (selectedIndex: number): void => {
    if (!isBrowser()) return;
    const root = options.getRoot();
    if (!root) return;
    const optionElements = collectOptions(root, itemSelector);
    const active = optionElements[selectedIndex];
    if (!active) {
      root.removeAttribute("aria-activedescendant");
      return;
    }
    if (active.id === "") {
      state.idCounter += 1;
      active.id = `vizel-combobox-option-${state.idCounter}`;
    }
    root.setAttribute("aria-activedescendant", active.id);
  };

  const setExpanded = (expanded: boolean): void => {
    if (!isBrowser()) return;
    const owner = options.getOwner?.();
    if (!owner) return;
    if (expanded) {
      owner.setAttribute("aria-expanded", "true");
      return;
    }
    owner.removeAttribute("aria-expanded");
  };

  const handleKey = (event: KeyboardEvent): boolean => {
    const root = options.getRoot();
    if (!root) return false;
    const length = collectOptions(root, itemSelector).length;
    const action = buildVizelComboboxKeySpec({
      key: event.key,
      currentIndex: keyboard.getSelectedIndex(),
      length,
    });
    if (action === null) return false;
    switch (action.type) {
      case "navigate":
        // The keyboard controller owns the navigation state; delegate so
        // its selected index and `onChange` callback stay authoritative,
        // then re-point `aria-activedescendant`.
        keyboard.setSelectedIndex(action.index);
        options.onChange(action.index);
        syncActiveDescendant(action.index);
        return true;
      case "select":
        options.onSelect?.(action.index);
        return true;
      case "close":
        options.onClose?.();
        return true;
      default:
        // `groupNext` has no framework-neutral target; the listener-owning
        // surface that needs grouping computes the index itself. Report the
        // key as unhandled here.
        return false;
    }
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
      setExpanded(true);
      syncActiveDescendant(keyboard.getSelectedIndex());
      state.isMounted = true;
    },
    unmount(): void {
      if (!isBrowser()) return;
      if (!state.isMounted) return;
      options.getRoot()?.removeEventListener("keydown", handleKeyDown);
      options.getRoot()?.removeAttribute("aria-activedescendant");
      setExpanded(false);
      state.isMounted = false;
    },
    update(selectedIndex: number): void {
      keyboard.setSelectedIndex(selectedIndex);
      syncActiveDescendant(selectedIndex);
    },
    handleKey,
    getSelectedIndex: () => keyboard.getSelectedIndex(),
    setSelectedIndex: (index: number): void => {
      keyboard.setSelectedIndex(index);
    },
  };
}
