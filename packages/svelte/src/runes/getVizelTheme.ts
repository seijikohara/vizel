import type { VizelResolvedTheme, VizelThemeState } from "@vizel/core";
import { getContext } from "svelte";
import { VIZEL_THEME_CONTEXT_KEY } from "../components/VizelThemeContext.js";

/**
 * Public return shape for `getVizelTheme`.
 *
 * The flat `{ current, setTheme }` shape mirrors the React hook and Vue
 * composable. `current` is the currently applied (resolved) theme so a
 * toggle is a one-liner. `setTheme` accepts only concrete
 * `VizelResolvedTheme` values because entering "system" mode is the
 * provider's `defaultTheme` concern, not a runtime toggle.
 */
export interface GetVizelThemeResult {
  /** Currently applied theme (resolved from the user's preference). */
  readonly current: VizelResolvedTheme;
  /** Switch the editor theme to a concrete value. */
  setTheme: (next: VizelResolvedTheme) => void;
}

/**
 * Get the editor theme and a setter from context.
 *
 * Must be used within a `VizelThemeProvider`.
 *
 * @example
 * ```svelte
 * <script>
 * const theme = getVizelTheme();
 * </script>
 *
 * <button onclick={() => theme.setTheme(theme.current === 'dark' ? 'light' : 'dark')}>
 *   Toggle theme
 * </button>
 * ```
 */
export function getVizelTheme(): GetVizelThemeResult {
  const context = getContext<VizelThemeState | undefined>(VIZEL_THEME_CONTEXT_KEY);

  if (!context) {
    throw new Error("getVizelTheme must be used within a VizelThemeProvider");
  }

  // Surface the resolved theme through the public `current` field. The
  // underlying `VizelThemeState` keeps `theme` (user setting) and
  // `resolvedTheme` (applied) separate; v2 collapses both into a single
  // observable so the toggle pattern stays a one-liner.
  //
  // `setTheme` is re-wrapped so the parameter type is physically narrowed
  // to `VizelResolvedTheme`. The underlying `context.setTheme` accepts the
  // wider `VizelTheme` (including "system"), and contravariant assignment
  // would let an `as VizelTheme` cast slip through; the wrapper closes
  // that hole.
  return {
    get current() {
      return context.resolvedTheme;
    },
    setTheme: (next: VizelResolvedTheme) => context.setTheme(next),
  };
}

/**
 * Get the editor theme safely (returns `null` outside a provider).
 *
 * Symmetric with {@link getVizelTheme} — the only difference is whether
 * the absence of a `VizelThemeProvider` is fatal.
 */
export function getVizelThemeSafe(): GetVizelThemeResult | null {
  const context = getContext<VizelThemeState | undefined>(VIZEL_THEME_CONTEXT_KEY);
  if (!context) return null;
  return {
    get current() {
      return context.resolvedTheme;
    },
    setTheme: (next: VizelResolvedTheme) => context.setTheme(next),
  };
}
