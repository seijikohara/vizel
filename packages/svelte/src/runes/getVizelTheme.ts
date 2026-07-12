import { VizelError, type VizelResolvedTheme, type VizelThemeState } from "@vizel/core";
import { getContext } from "svelte";

import { VIZEL_THEME_CONTEXT_KEY } from "../components/VizelThemeContext.js";

/**
 * Public return shape for `getVizelTheme`.
 *
 * The flat `{ current, setTheme }` shape parallels the React hook's
 * `{ theme, setTheme }` and the Vue composable's
 * `{ theme: ComputedRef<…>, setTheme }`. The scalar field is named
 * `current` here so it lines up with every other Svelte rune accessor
 * (`editor.current`, `state.current`, etc.); each adapter follows its
 * native idiom rather than a shared field name across frameworks.
 * `current` is the currently applied (resolved) theme so a toggle is a
 * one-liner. `setTheme` accepts only concrete `VizelResolvedTheme`
 * values because entering "system" mode is the provider's
 * `defaultTheme` concern, not a runtime toggle.
 */
export interface GetVizelThemeResult {
  /** Currently applied theme (resolved from the user's preference). */
  readonly current: VizelResolvedTheme;
  /** Switch the editor theme to a concrete value. */
  setTheme: (next: VizelResolvedTheme) => void;
  /**
   * Drop the user's manual selection and resume tracking the OS
   * `prefers-color-scheme` preference. The provider's stored selection is
   * replaced with `"system"`, and `current` updates to whatever the OS
   * currently reports.
   */
  resetToSystem: () => void;
}

/**
 * Project a provider `VizelThemeState` onto the public result shape.
 *
 * `getVizelTheme` and `getVizelThemeSafe` return identical shapes; the
 * helper keeps the projection in one place. `current` reads the resolved
 * theme through a getter so the value stays reactive. `setTheme` is
 * re-wrapped so the parameter type is physically narrowed to
 * `VizelResolvedTheme`: `context.setTheme` accepts the wider `VizelTheme`
 * (including `"system"`), and contravariant assignment would let an
 * `as VizelTheme` cast slip through; the wrapper closes that hole.
 */
const toVizelThemeResult = (context: VizelThemeState): GetVizelThemeResult => ({
  get current() {
    return context.resolvedTheme;
  },
  setTheme: (next: VizelResolvedTheme) => context.setTheme(next),
  resetToSystem: () => context.setTheme("system"),
});

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
    throw new VizelError(
      "MISSING_CONTEXT",
      "getVizelTheme must be used within a VizelThemeProvider"
    );
  }

  return toVizelThemeResult(context);
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
  return toVizelThemeResult(context);
}
