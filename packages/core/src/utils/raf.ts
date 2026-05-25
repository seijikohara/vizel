/**
 * SSR-safe wrappers around `requestAnimationFrame` /
 * `cancelAnimationFrame`.
 *
 * On Node, edge runtimes, and any environment that does not expose
 * `requestAnimationFrame`, the request shim falls back to a
 * microtask-deferred callback so consumers that schedule one tick of
 * work (debouncers, render flushers) still observe completion. The
 * cancel shim becomes a no-op when the underlying function is missing.
 *
 * These helpers exist because Vizel's framework hooks
 * (`useVizelMarkdown` / `createVizelMarkdown`) schedule a poll loop on
 * editor `update` events. Calling `requestAnimationFrame`
 * unconditionally crashed in `happy-dom`-based tests and Nuxt
 * `<ClientOnly>` boundaries where `window` is defined but `rAF` is not.
 */

const HAS_RAF = typeof requestAnimationFrame === "function";
const HAS_CANCEL_RAF = typeof cancelAnimationFrame === "function";

/**
 * Schedule `callback` for the next animation frame, or — when the
 * environment does not implement rAF — for the next microtask. Returns
 * a numeric handle that {@link vizelCancelAnimationFrame} accepts.
 */
export function vizelRequestAnimationFrame(callback: () => void): number {
  if (HAS_RAF) return requestAnimationFrame(callback);
  // Use queueMicrotask so the callback still runs asynchronously,
  // matching rAF's call-after-current-task semantics for consumers
  // that depend on the deferral (debouncers, paint-coalesced poll
  // loops).
  queueMicrotask(callback);
  return 0;
}

/**
 * Cancel a previously scheduled animation-frame callback. Becomes a
 * no-op when the underlying API is unavailable or when the handle is
 * the sentinel `0` returned by the SSR fallback path.
 */
export function vizelCancelAnimationFrame(id: number | null): void {
  if (id === null || id === 0) return;
  if (HAS_CANCEL_RAF) cancelAnimationFrame(id);
}
