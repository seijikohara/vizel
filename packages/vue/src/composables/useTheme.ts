import type { ThemeState } from "@vizel/core";
import { inject } from "vue";
import { ThemeContextKey } from "../components/ThemeContext";

/**
 * Composable to access theme state and controls
 *
 * Must be used within a ThemeProvider
 *
 * @example
 * ```vue
 * <script setup>
 * const { theme, setTheme, resolvedTheme } = useTheme();
 * </script>
 *
 * <template>
 *   <button @click="setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')">
 *     Toggle theme
 *   </button>
 * </template>
 * ```
 */
export function useTheme(): ThemeState {
  const context = inject(ThemeContextKey);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

/**
 * Composable to access theme state safely (returns null if not in provider)
 */
export function useThemeSafe(): ThemeState | null {
  return inject(ThemeContextKey, null);
}
