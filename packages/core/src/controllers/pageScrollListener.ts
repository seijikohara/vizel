/**
 * Returned by {@link createVizelPageScrollListener}.
 *
 * Follows the canonical controller contract: `mount()` attaches the
 * page-level `scroll` and `resize` listeners, `unmount()` removes
 * them. Both methods are idempotent and SSR-safe.
 */
export interface VizelPageScrollListener {
  /** Subscribe to page scroll and resize events. */
  readonly mount: () => void;
  /** Unsubscribe. Safe to call repeatedly. */
  readonly unmount: () => void;
}

/**
 * Build a controller that fires `callback` on every page scroll or
 * window resize.
 *
 * Components that paint based on the editor's position inside the
 * page viewport (the minimap viewport overlay, sticky outline
 * highlights, etc.) need to know when that position changes. The
 * editor's own subscription stream does not include page scroll, so
 * the controller wires the missing source through the same
 * `{ mount, unmount }` contract Vizel uses for every DOM-owning
 * primitive — framework adapters do not call
 * `window.addEventListener` directly (see `.claude/rules/architecture.md`,
 * "Core Concepts").
 *
 * The listeners are registered passive so scrolling stays smooth.
 * `callback` is called synchronously on every event; pair with
 * `requestAnimationFrame` in the consumer if work needs to be
 * coalesced.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() => {
 *   const controller = createVizelPageScrollListener(redraw);
 *   controller.mount();
 *   return () => controller.unmount();
 * }, [redraw]);
 * ```
 */
export function createVizelPageScrollListener(callback: () => void): VizelPageScrollListener {
  const state = { isMounted: false };

  return {
    mount: (): void => {
      if (typeof window === "undefined") return;
      if (state.isMounted) return;
      window.addEventListener("scroll", callback, { passive: true });
      window.addEventListener("resize", callback, { passive: true });
      state.isMounted = true;
    },
    unmount: (): void => {
      if (typeof window === "undefined") return;
      if (!state.isMounted) return;
      window.removeEventListener("scroll", callback);
      window.removeEventListener("resize", callback);
      state.isMounted = false;
    },
  };
}
