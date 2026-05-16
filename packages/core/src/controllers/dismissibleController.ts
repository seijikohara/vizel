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
 * Wire up "click-outside" + Escape dismissal listeners.
 *
 * Encapsulates the three-step pattern of (1) attaching a `mousedown`
 * listener on `document` that compares the event target against the
 * supplied element references and (2) attaching a `keydown` listener
 * that observes Escape, plus (3) detaching both on disposal.
 *
 * Returns a disposer. Framework adapters call this inside their effect
 * primitive and return the disposer for cleanup.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() =>
 *   createVizelDismissibleController({
 *     getElements: () => [popoverRef.current, triggerRef.current],
 *     onDismiss: () => setOpen(false),
 *   }),
 * []);
 * ```
 */
export function createVizelDismissibleController(
  options: VizelDismissibleControllerOptions
): () => void {
  const { getElements, onDismiss, dismissOnEscape = true } = options;

  const handleMouseDown = (event: MouseEvent) => {
    if (!(event.target instanceof Node)) return;
    const target = event.target;
    for (const el of getElements()) {
      if (el?.contains(target)) return;
    }
    onDismiss();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onDismiss();
    }
  };

  document.addEventListener("mousedown", handleMouseDown);
  if (dismissOnEscape) {
    document.addEventListener("keydown", handleKeyDown);
  }

  return () => {
    document.removeEventListener("mousedown", handleMouseDown);
    if (dismissOnEscape) {
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
}
