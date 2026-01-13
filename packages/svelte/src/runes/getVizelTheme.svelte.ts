import type { VizelThemeState } from "@vizel/core";
import { getContext } from "svelte";
import { VIZEL_THEME_CONTEXT_KEY } from "../components/VizelThemeProvider.svelte";

/**
 * Get theme state and controls from context
 *
 * Must be used within a VizelThemeProvider
 *
 * @example
 * ```svelte
 * <script>
 * const theme = getVizelTheme();
 * </script>
 *
 * <button onclick={() => theme.setTheme(theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *   Toggle theme
 * </button>
 * ```
 */
export function getVizelTheme(): VizelThemeState {
  const context = getContext<VizelThemeState | undefined>(VIZEL_THEME_CONTEXT_KEY);

  if (!context) {
    throw new Error("getVizelTheme must be used within a VizelThemeProvider");
  }

  return context;
}

/**
 * Get theme state safely (returns null if not in provider)
 */
export function getVizelThemeSafe(): VizelThemeState | null {
  return getContext<VizelThemeState | undefined>(VIZEL_THEME_CONTEXT_KEY) ?? null;
}
