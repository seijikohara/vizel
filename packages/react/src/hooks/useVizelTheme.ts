import { VizelError, type VizelResolvedTheme } from "@vizel/core";
import { useContext, useMemo } from "react";

import { VizelThemeContext } from "../components/VizelThemeContext.tsx";

/**
 * Public return shape for `useVizelTheme`.
 *
 * The flat `{ theme, setTheme, resetToSystem }` shape mirrors the Vue
 * composable and Svelte rune. `theme` is the currently applied (resolved)
 * theme so a toggle is a one-liner. `setTheme` accepts only concrete
 * `VizelResolvedTheme` values to keep the toggle ergonomics tight;
 * re-entering the "follow OS preference" mode is the dedicated
 * `resetToSystem` method instead of an overload.
 */
export interface UseVizelThemeResult {
  /** Currently applied theme (resolved from the user's preference). */
  theme: VizelResolvedTheme;
  /** Switch the editor theme to a concrete value. */
  setTheme: (next: VizelResolvedTheme) => void;
  /**
   * Drop the user's manual selection and resume tracking the OS
   * `prefers-color-scheme` preference. The provider's stored selection is
   * replaced with `"system"`, and `theme` updates to whatever the OS
   * currently reports.
   */
  resetToSystem: () => void;
}

/**
 * Hook to access the editor theme and a setter.
 *
 * Must be used within a `VizelThemeProvider`.
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useVizelTheme();
 *
 * return (
 *   <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
 *     Toggle theme
 *   </button>
 * );
 * ```
 */
export function useVizelTheme(): UseVizelThemeResult {
  const context = useContext(VizelThemeContext);

  if (!context) {
    throw new VizelError(
      "MISSING_CONTEXT",
      "useVizelTheme must be used within a VizelThemeProvider"
    );
  }

  // Surface only the resolved theme through the public `theme` field. The
  // underlying `VizelThemeState` keeps `theme` (user setting) and
  // `resolvedTheme` (applied) separate; the hook collapses both into a single
  // observable so the toggle pattern stays a one-liner.
  //
  // `setTheme` is re-wrapped so the parameter type is physically narrowed
  // to `VizelResolvedTheme`. The underlying `context.setTheme` accepts
  // the wider `VizelTheme` (including "system"), and contravariant
  // assignment would let an `as VizelTheme` cast slip through; the
  // wrapper makes the narrowing structural.
  return useMemo<UseVizelThemeResult>(
    () => ({
      theme: context.resolvedTheme,
      setTheme: (next: VizelResolvedTheme) => context.setTheme(next),
      resetToSystem: () => context.setTheme("system"),
    }),
    [context]
  );
}

/**
 * Hook to access the theme safely. Returns `null` outside a
 * `VizelThemeProvider`.
 *
 * Symmetric with {@link useVizelTheme} — the only difference is whether the
 * absence of a provider is fatal.
 */
export function useVizelThemeSafe(): UseVizelThemeResult | null {
  const context = useContext(VizelThemeContext);
  // The Rules of Hooks require an unconditional `useMemo` call, so memoize
  // before bailing out. The hook order stays stable across provider mounts.
  const result = useMemo<UseVizelThemeResult | null>(
    () =>
      context
        ? {
            theme: context.resolvedTheme,
            setTheme: (next: VizelResolvedTheme) => context.setTheme(next),
            resetToSystem: () => context.setTheme("system"),
          }
        : null,
    [context]
  );
  return result;
}
