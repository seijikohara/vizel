/**
 * Focus-trap primitive.
 *
 * Confines keyboard focus to one element subtree while a modal-style
 * surface is open. Vizel's link editor and find-replace forms open over
 * the editor as popover forms; a keyboard user who presses Tab past the
 * last field must wrap to the first field instead of escaping into the
 * page behind the form. The trap lives in `@vizel/headless` rather than
 * each adapter so the link editor and find-replace forms share one
 * implementation; the DOM-touching variant follows the
 * `{ mount, unmount, update }` contract so adapter components attach no
 * listeners themselves.
 *
 * `buildVizelFocusTrapSpec` is pure: it merges caller options with the
 * defaults and returns the resolved spec, so a test or a server render
 * reads the configuration without a DOM. `createVizelFocusTrapController`
 * owns the `keydown` listener on the trapped element and the focus moves.
 *
 * The controller composes with {@link createVizelDismissable}: the
 * dismissable still closes the surface on Escape or an outside pointer,
 * and the trap's `unmount` returns focus to the previously-active element
 * once the surface closes. The trap deliberately ignores Escape so the
 * dismissable remains the single owner of the close gesture.
 */

/**
 * CSS selector matching the elements the trap treats as focusable.
 *
 * The list covers the natively-focusable form controls plus anchors with
 * an `href` and any element carrying a non-negative `tabindex`. The
 * `:not([tabindex="-1"])` clause drops elements explicitly removed from
 * the tab order; the per-element visibility and `disabled` checks in
 * {@link collectFocusable} drop the rest, because a CSS selector alone
 * cannot observe computed visibility.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const isBrowser = (): boolean => typeof document !== "undefined";

/**
 * Report whether an element can currently receive focus.
 *
 * The guard rejects a disabled control and an element the layout engine
 * does not render (`offsetParent === null` covers `display: none` and a
 * `display: none` ancestor). A `hidden` attribute also disqualifies the
 * element. The check reads only properties present on a real
 * `HTMLElement`, so a Server-Side Rendering (SSR) run never reaches it.
 */
const isFocusable = (element: HTMLElement): boolean => {
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.hidden) return false;
  // `offsetParent` is `null` for an element rendered with `display: none`
  // (directly or through an ancestor). A trapped form hides optional rows
  // conditionally, so this check excludes the rows the framework did not
  // render into the visible tree.
  return element.offsetParent !== null;
};

/**
 * Collect the focusable elements inside `target` in document order.
 *
 * The function queries {@link FOCUSABLE_SELECTOR} and then filters with
 * {@link isFocusable} so hidden or disabled matches drop out. The result
 * drives both the initial focus move and the Tab wraparound.
 */
const collectFocusable = (target: HTMLElement): readonly HTMLElement[] => {
  const matches = Array.from(target.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return matches.filter(isFocusable);
};

/**
 * Options shared by {@link buildVizelFocusTrapSpec} and
 * {@link createVizelFocusTrapController}.
 */
export interface VizelFocusTrapOptions {
  /**
   * CSS selector for the element that receives focus on mount. When the
   * selector matches nothing, or stays unset, the trap focuses the first
   * focusable element inside the target. The link editor uses the default
   * so focus lands on the URL input; a consumer that wants a different
   * initial field passes a selector.
   */
  readonly initialFocusSelector?: string;
  /**
   * When `true` (the default), `unmount` returns focus to the element
   * that held focus at mount time. A consumer that manages the return
   * itself — for example a find-replace panel that focuses the editor in
   * its own close handler — passes `false`.
   */
  readonly returnFocusOnUnmount?: boolean;
}

/**
 * Resolved focus-trap configuration returned by
 * {@link buildVizelFocusTrapSpec}.
 *
 * Every optional input resolves to a concrete value so a caller reads the
 * effective behaviour without re-applying defaults. `initialFocusSelector`
 * stays `null` when the caller supplies none, signalling "focus the first
 * focusable element".
 */
export interface VizelFocusTrapSpec {
  /** The resolved initial-focus selector, or `null` for first-focusable. */
  readonly initialFocusSelector: string | null;
  /** Whether `unmount` restores focus to the pre-mount element. */
  readonly returnFocusOnUnmount: boolean;
}

/**
 * Return the resolved focus-trap spec for the supplied options.
 *
 * The function is pure and Server-Side Rendering (SSR) safe; it merges the
 * caller options with the defaults (`initialFocusSelector: null`,
 * `returnFocusOnUnmount: true`) and returns the resolved spec.
 *
 * @example
 * ```ts
 * const spec = buildVizelFocusTrapSpec();
 * // spec === { initialFocusSelector: null, returnFocusOnUnmount: true }
 * ```
 */
export function buildVizelFocusTrapSpec(options: VizelFocusTrapOptions = {}): VizelFocusTrapSpec {
  return {
    initialFocusSelector: options.initialFocusSelector ?? null,
    returnFocusOnUnmount: options.returnFocusOnUnmount !== false,
  };
}

/**
 * Returned by {@link createVizelFocusTrapController}.
 *
 * The controller owns the `keydown` listener on the trapped element and
 * the focus moves, following the `{ mount, unmount, update }` contract.
 */
export interface VizelFocusTrapController {
  /**
   * Trap focus inside `target`. The controller records the active
   * element, moves focus to the initial element, and installs the
   * `keydown` listener. Re-mounting on a different target unmounts the
   * previous target first.
   */
  mount(target: HTMLElement): void;
  /**
   * Detach the listener and, unless `returnFocusOnUnmount` is `false`,
   * restore focus to the element that held it at mount time. Calling
   * `unmount` more than once is a no-op.
   */
  unmount(): void;
  /** Replace the options without re-attaching the listener. */
  update(options: VizelFocusTrapOptions): void;
}

/**
 * Resolve the element that receives focus on mount.
 *
 * The function prefers an `initialFocusSelector` match inside `target`
 * (when the match is focusable) and falls back to the first focusable
 * element. It returns `null` when the target holds no focusable element,
 * leaving focus where the browser placed it.
 */
const resolveInitialFocus = (
  target: HTMLElement,
  spec: VizelFocusTrapSpec,
  focusable: readonly HTMLElement[]
): HTMLElement | null => {
  if (spec.initialFocusSelector !== null) {
    const preferred = target.querySelector<HTMLElement>(spec.initialFocusSelector);
    if (preferred !== null && isFocusable(preferred)) return preferred;
  }
  return focusable[0] ?? null;
};

/**
 * Construct a focus-trap controller for a modal-style surface.
 *
 * The controller wires three concerns under one `{ mount, unmount }`
 * lifecycle:
 *
 * 1. **Initial focus.** `mount` records `document.activeElement`, then
 *    focuses the `initialFocusSelector` match or the first focusable
 *    element inside the target.
 * 2. **Tab containment.** A `keydown` listener intercepts Tab and
 *    Shift+Tab. When focus sits on the last focusable element, Tab wraps
 *    to the first; when focus sits on the first, Shift+Tab wraps to the
 *    last. The listener computes the focusable set on every keystroke so
 *    a form that shows or hides rows mid-interaction wraps correctly.
 * 3. **Return focus.** `unmount` restores focus to the recorded element
 *    unless `returnFocusOnUnmount` is `false`.
 *
 * The controller never handles Escape: {@link createVizelDismissable}
 * owns the close gesture, so the two controllers compose without fighting
 * over the key. Server-Side Rendering (SSR) safe: `mount` short-circuits
 * when the DOM is unavailable.
 *
 * @example
 * ```ts
 * const trap = createVizelFocusTrapController();
 * trap.mount(formElement); // focuses the first field, traps Tab
 * // teardown: trap.unmount(); // returns focus to the trigger
 * ```
 */
export function createVizelFocusTrapController(
  initialOptions: VizelFocusTrapOptions = {}
): VizelFocusTrapController {
  const state = {
    options: initialOptions,
    target: null as HTMLElement | null,
    previousActive: null as HTMLElement | null,
    keydownHandler: null as ((event: KeyboardEvent) => void) | null,
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") return;
    const target = state.target;
    if (target === null) return;
    const focusable = collectFocusable(target);
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (first === undefined || last === undefined) {
      // Nothing to focus inside the trap; keep focus pinned to the target
      // so Tab does not escape into the page behind the surface.
      event.preventDefault();
      return;
    }
    const active = isBrowser() ? document.activeElement : null;
    if (event.shiftKey) {
      // Shift+Tab from the first element (or from outside the focusable
      // set) wraps to the last element.
      if (active === first || !target.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    // Tab from the last element (or from outside the focusable set) wraps
    // to the first element.
    if (active === last || !target.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  const detachListener = (): void => {
    if (state.keydownHandler !== null && state.target !== null) {
      state.target.removeEventListener("keydown", state.keydownHandler);
    }
    state.keydownHandler = null;
  };

  return {
    mount(target: HTMLElement): void {
      if (!isBrowser()) return;
      if (state.target === target) return;
      if (state.target !== null) detachListener();
      state.target = target;
      // Record the focused element before the move so `unmount` can
      // restore it. `document.activeElement` is the trigger that opened
      // the surface (a bubble-menu button or a shortcut-focused editor).
      const active = document.activeElement;
      state.previousActive = active instanceof HTMLElement ? active : null;
      const spec = buildVizelFocusTrapSpec(state.options);
      const focusable = collectFocusable(target);
      resolveInitialFocus(target, spec, focusable)?.focus();
      state.keydownHandler = handleKeydown;
      target.addEventListener("keydown", handleKeydown);
    },
    unmount(): void {
      if (state.target === null) return;
      detachListener();
      const spec = buildVizelFocusTrapSpec(state.options);
      const previous = state.previousActive;
      state.target = null;
      state.previousActive = null;
      // Restore focus only when the recorded element is still connected:
      // the surface may have closed by a path that already removed the
      // trigger, in which case focusing a detached node throws or silently
      // no-ops. The `isConnected` guard keeps the restore best-effort.
      if (spec.returnFocusOnUnmount && previous?.isConnected) {
        previous.focus();
      }
    },
    update(options: VizelFocusTrapOptions): void {
      state.options = options;
    },
  };
}
