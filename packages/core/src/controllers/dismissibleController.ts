/**
 * Options for {@link createVizelDismissibleController}.
 */
export interface VizelDismissibleControllerOptions {
  /**
   * Element references the controller should respect when deciding whether
   * a click is "outside". A click whose target is contained in any of these
   * elements does not dismiss. `null` entries are ignored, so framework
   * adapters can pass ref/state getters that resolve lazily.
   */
  getElements: () => ReadonlyArray<Element | null | undefined>;
  /** Invoked when the user clicks outside or presses Escape. */
  onDismiss: () => void;
  /**
   * Whether to dismiss on Escape (default: true). Set to false when the
   * caller wants to handle Escape separately (e.g., to clear search input
   * before closing).
   */
  dismissOnEscape?: boolean;
}

/**
 * Returned by {@link createVizelDismissibleController}.
 *
 * Follows the canonical controller contract: `mount()` activates the DOM
 * listeners, `unmount()` removes them. Both methods are idempotent and
 * Server-Side Rendering (SSR) safe (no-op when `document` is absent).
 */
export interface VizelDismissibleController {
  /** Attach the outside-click and Escape listeners to `document`. */
  readonly mount: () => void;
  /** Remove the attached listeners. Safe to call multiple times. */
  readonly unmount: () => void;
}

/**
 * Build a controller that dismisses a popup on outside-click or Escape.
 *
 * The factory itself has no side effects, making it Server-Side Rendering
 * (SSR) safe to invoke during component setup. `mount()` attaches a
 * `mousedown` listener on `document` that compares the event target
 * against the supplied element references, plus a `keydown` listener that
 * observes Escape. `unmount()` detaches both. Both methods are idempotent.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() => {
 *   const controller = createVizelDismissibleController({
 *     getElements: () => [popoverRef.current, triggerRef.current],
 *     onDismiss: () => setOpen(false),
 *   });
 *   controller.mount();
 *   return () => controller.unmount();
 * }, []);
 * ```
 */
export function createVizelDismissibleController(
  options: VizelDismissibleControllerOptions
): VizelDismissibleController {
  const { getElements, onDismiss, dismissOnEscape = true } = options;

  const handleMouseDown = (event: MouseEvent): void => {
    if (!(event.target instanceof Node)) return;
    const target = event.target;
    for (const el of getElements()) {
      if (el?.contains(target)) return;
    }
    onDismiss();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      onDismiss();
    }
  };

  const state = { isMounted: false };

  return {
    mount: (): void => {
      // SSR guard: skip DOM work when `document` is unavailable.
      if (typeof document === "undefined") return;
      if (state.isMounted) return;
      document.addEventListener("mousedown", handleMouseDown);
      if (dismissOnEscape) {
        document.addEventListener("keydown", handleKeyDown);
      }
      state.isMounted = true;
    },
    unmount: (): void => {
      if (typeof document === "undefined") return;
      if (!state.isMounted) return;
      document.removeEventListener("mousedown", handleMouseDown);
      if (dismissOnEscape) {
        document.removeEventListener("keydown", handleKeyDown);
      }
      state.isMounted = false;
    },
  };
}
