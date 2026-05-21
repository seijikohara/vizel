import type { VizelResolvedTheme } from "../theme.ts";

/**
 * Returned by {@link createVizelSystemThemeListener}.
 *
 * Follows the canonical controller contract: `mount()` activates the
 * media-query listener, `unmount()` removes it. Both are idempotent and
 * SSR-safe.
 */
export interface VizelSystemThemeListener {
  /** Subscribe to `prefers-color-scheme` changes. */
  readonly mount: () => void;
  /** Unsubscribe. Safe to call repeatedly. */
  readonly unmount: () => void;
}

/**
 * Build a controller for system theme (`prefers-color-scheme`) changes.
 *
 * The factory itself has no side effects. `mount()` attaches a
 * `MediaQueryList` listener; on SSR the method is a no-op.
 * `unmount()` removes the listener. Both are idempotent.
 *
 * @example
 * ```tsx
 * // React adapter:
 * useEffect(() => {
 *   const controller = createVizelSystemThemeListener((theme) => setTheme(theme));
 *   controller.mount();
 *   return () => controller.unmount();
 * }, []);
 * ```
 */
export function createVizelSystemThemeListener(
  callback: (theme: VizelResolvedTheme) => void
): VizelSystemThemeListener {
  const handleChange = (event: MediaQueryListEvent): void => {
    callback(event.matches ? "dark" : "light");
  };

  const state: { mediaQuery: MediaQueryList | null; isMounted: boolean } = {
    mediaQuery: null,
    isMounted: false,
  };

  return {
    mount: (): void => {
      if (typeof window === "undefined") return;
      if (state.isMounted) return;
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleChange);
      state.mediaQuery = mediaQuery;
      state.isMounted = true;
    },
    unmount: (): void => {
      if (typeof window === "undefined") return;
      if (!(state.isMounted && state.mediaQuery)) return;
      state.mediaQuery.removeEventListener("change", handleChange);
      state.mediaQuery = null;
      state.isMounted = false;
    },
  };
}
