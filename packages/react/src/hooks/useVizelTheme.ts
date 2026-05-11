import type { VizelThemeState } from "@vizel/core";
import { useContext } from "react";
import { VizelThemeContext } from "../components/VizelThemeContext.tsx";

/**
 * Hook to access theme state and controls.
 *
 * Must be used within a `VizelThemeProvider`.
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useVizelTheme();
 *
 * return (
 *   <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *     Toggle theme
 *   </button>
 * );
 * ```
 */
export function useVizelTheme(): VizelThemeState {
  const context = useContext(VizelThemeContext);

  if (!context) {
    throw new Error("useVizelTheme must be used within a VizelThemeProvider");
  }

  return context;
}

/**
 * Hook to access theme state safely. Returns `null` if used outside a
 * `VizelThemeProvider`.
 */
export function useVizelThemeSafe(): VizelThemeState | null {
  return useContext(VizelThemeContext);
}
