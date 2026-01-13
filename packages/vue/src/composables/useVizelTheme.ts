import type { VizelThemeState } from "@vizel/core";
import { inject } from "vue";
import { VIZEL_THEME_CONTEXT_KEY } from "../components/VizelThemeContext";

/**
 * Composable to access theme state and controls
 *
 * Must be used within a VizelThemeProvider
 *
 * @example
 * ```vue
 * <script setup>
 * const { theme, setTheme, resolvedTheme } = useVizelTheme();
 * </script>
 *
 * <template>
 *   <button @click="setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')">
 *     Toggle theme
 *   </button>
 * </template>
 * ```
 */
export function useVizelTheme(): VizelThemeState {
  const context = inject(VIZEL_THEME_CONTEXT_KEY);

  if (!context) {
    throw new Error("useVizelTheme must be used within a VizelThemeProvider");
  }

  return context;
}

/**
 * Composable to access theme state safely (returns null if not in provider)
 */
export function useVizelThemeSafe(): VizelThemeState | null {
  return inject(VIZEL_THEME_CONTEXT_KEY, null);
}
