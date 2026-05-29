/**
 * Dismissable controller.
 *
 * Wires the three signals every floating UI surface in Vizel needs to
 * dismiss: pointer activity outside the surface, the `Escape` key, and
 * focus that leaves the surface entirely. The controller owns the
 * `document`-level listeners so framework adapters never attach them
 * directly. ADR-0007 (controller delegation) and ADR-0003 (headless
 * package) record the constraints this controller honours.
 *
 * The factory returns a `{ mount, unmount, update }` controller. Each
 * `mount(target)` activates the listeners against the supplied target;
 * `unmount()` detaches every listener and is safe to call repeatedly.
 */

export interface VizelDismissableOptions {
  /**
   * Fires when the user clicks or taps outside the mount target. The
   * callback receives the originating `EventTarget` so a composing
   * controller can exclude additional elements (for example a popover
   * trigger that lives outside the body) before dismissing.
   * Implementations typically close the surface from this callback.
   */
  readonly onPointerOutside?: (target: EventTarget | null) => void;
  /**
   * Fires when the user presses Escape while the surface is mounted.
   */
  readonly onEscape?: () => void;
  /**
   * Fires when keyboard focus leaves the mount target. The callback
   * receives the element that gained focus.
   */
  readonly onFocusOutside?: (nextFocus: Element | null) => void;
  /**
   * When `true`, the Escape handler uses capture phase and calls
   * `event.stopImmediatePropagation()` so the editor's own Escape
   * binding does not also fire. Defaults to `false`.
   */
  readonly captureEscape?: boolean;
  /**
   * When `true`, the controller defers pointer-listener installation
   * until the next animation frame. Editor menus that open in
   * response to a pointerdown event use this to avoid swallowing the
   * opening event as an outside click. Defaults to `false`.
   */
  readonly deferPointerHandler?: boolean;
}

export interface VizelDismissableController {
  /**
   * Activate dismissal handlers against `target`. Re-mounting on a
   * different target unmounts the previous target first.
   */
  mount(target: HTMLElement): void;
  /**
   * Detach every listener. Calling `unmount()` more than once is a
   * no-op.
   */
  unmount(): void;
  /**
   * Update the callbacks without re-attaching listeners. The
   * controller invokes the latest callback at every event delivery.
   */
  update(options: VizelDismissableOptions): void;
}

const isBrowser = (): boolean => typeof document !== "undefined";

/**
 * Construct a dismissable controller for a floating surface.
 *
 * The controller is the home for the listener wiring that v1
 * framework components attached directly to `document`. Adapter code
 * obtains the controller through `@vizel/headless`, passes its root
 * element into `mount`, and detaches via `unmount` on lifecycle
 * teardown.
 */
export function createVizelDismissable(
  initialOptions: VizelDismissableOptions = {}
): VizelDismissableController {
  const state = {
    options: initialOptions,
    target: null as HTMLElement | null,
    pointerHandler: null as ((event: PointerEvent) => void) | null,
    escapeHandler: null as ((event: KeyboardEvent) => void) | null,
    focusHandler: null as ((event: FocusEvent) => void) | null,
    pointerInstallTimer: null as number | null,
  };

  const detachListeners = (): void => {
    if (!isBrowser()) return;
    if (state.pointerInstallTimer !== null) {
      window.clearTimeout(state.pointerInstallTimer);
      state.pointerInstallTimer = null;
    }
    if (state.pointerHandler !== null) {
      document.removeEventListener("pointerdown", state.pointerHandler, true);
      state.pointerHandler = null;
    }
    if (state.escapeHandler !== null) {
      document.removeEventListener(
        "keydown",
        state.escapeHandler,
        Boolean(state.options.captureEscape)
      );
      state.escapeHandler = null;
    }
    if (state.focusHandler !== null) {
      document.removeEventListener("focusin", state.focusHandler, true);
      state.focusHandler = null;
    }
  };

  const installPointerHandler = (target: HTMLElement): void => {
    const handler = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return;
      if (target.contains(event.target)) return;
      state.options.onPointerOutside?.(event.target);
    };
    state.pointerHandler = handler;
    document.addEventListener("pointerdown", handler, true);
  };

  const installEscapeHandler = (): void => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      if (state.options.captureEscape) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      state.options.onEscape?.();
    };
    state.escapeHandler = handler;
    document.addEventListener("keydown", handler, Boolean(state.options.captureEscape));
  };

  const installFocusHandler = (target: HTMLElement): void => {
    const handler = (event: FocusEvent): void => {
      if (event.target instanceof Node && target.contains(event.target)) return;
      const next = event.target instanceof Element ? event.target : null;
      state.options.onFocusOutside?.(next);
    };
    state.focusHandler = handler;
    document.addEventListener("focusin", handler, true);
  };

  return {
    mount(target: HTMLElement): void {
      if (!isBrowser()) return;
      if (state.target === target) return;
      detachListeners();
      state.target = target;
      if (state.options.deferPointerHandler) {
        state.pointerInstallTimer = window.setTimeout(() => {
          state.pointerInstallTimer = null;
          installPointerHandler(target);
        }, 0);
      } else {
        installPointerHandler(target);
      }
      installEscapeHandler();
      installFocusHandler(target);
    },
    unmount(): void {
      detachListeners();
      state.target = null;
    },
    update(options: VizelDismissableOptions): void {
      state.options = options;
    },
  };
}
