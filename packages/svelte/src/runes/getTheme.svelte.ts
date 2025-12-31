import type { ThemeState } from "@vizel/core";
import { getContext } from "svelte";
import { THEME_CONTEXT_KEY } from "../components/ThemeProvider.svelte";

/**
 * Get theme state and controls from context
 *
 * Must be used within a ThemeProvider
 *
 * @example
 * ```svelte
 * <script>
 * const theme = getTheme();
 * </script>
 *
 * <button onclick={() => theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *   Toggle theme
 * </button>
 * ```
 */
export function getTheme(): ThemeState {
  const context = getContext<ThemeState | undefined>(THEME_CONTEXT_KEY);

  if (!context) {
    throw new Error("getTheme must be used within a ThemeProvider");
  }

  return context;
}

/**
 * Get theme state safely (returns null if not in provider)
 */
export function getThemeSafe(): ThemeState | null {
  return getContext<ThemeState | undefined>(THEME_CONTEXT_KEY) ?? null;
}
