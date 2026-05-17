import type { VizelResolvedTheme, VizelTheme } from "@vizel/core";
import { type ComputedRef, computed, inject } from "vue";
import { VIZEL_THEME_CONTEXT_KEY } from "../components/VizelThemeContext";

/**
 * Public return shape for `useVizelTheme`.
 *
 * The flat `{ theme, setTheme }` shape mirrors the React hook and Svelte
 * rune. `theme` reflects the currently applied (resolved) theme so consumers
 * can build a simple toggle without reading any other field. `setTheme`
 * accepts only `"light" | "dark"` because the v2 surface intentionally
 * restricts callers to concrete themes — entering "system" mode is the
 * provider's `defaultTheme` concern, not a runtime toggle.
 */
export interface UseVizelThemeResult {
  /** Currently applied theme (resolved from the user's preference). */
  theme: ComputedRef<VizelTheme>;
  /** Switch the editor theme to a concrete value. */
  setTheme: (next: "light" | "dark") => void;
}

/**
 * Composable to access the editor theme and a setter.
 *
 * Must be used within a `VizelThemeProvider`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { theme, setTheme } = useVizelTheme();
 * </script>
 *
 * <template>
 *   <button @click="setTheme(theme === 'dark' ? 'light' : 'dark')">
 *     Toggle theme
 *   </button>
 * </template>
 * ```
 */
export function useVizelTheme(): UseVizelThemeResult {
  const context = inject(VIZEL_THEME_CONTEXT_KEY);

  if (!context) {
    throw new Error("useVizelTheme must be used within a VizelThemeProvider");
  }

  return {
    // Surface the resolved theme through the public `theme` field. The
    // underlying `VizelThemeState` keeps `theme` (user setting) and
    // `resolvedTheme` (applied) separate; v2 collapses both into a single
    // observable so the toggle pattern stays a one-liner.
    theme: computed<VizelTheme>(() => context.resolvedTheme satisfies VizelResolvedTheme),
    setTheme: context.setTheme,
  };
}

/**
 * Composable to access the theme safely (returns `null` outside a provider).
 *
 * Symmetric with `useVizelTheme` — the only difference is whether the absence
 * of a `VizelThemeProvider` is fatal.
 */
export function useVizelThemeSafe(): UseVizelThemeResult | null {
  const context = inject(VIZEL_THEME_CONTEXT_KEY, null);
  if (!context) return null;
  return {
    theme: computed<VizelTheme>(() => context.resolvedTheme satisfies VizelResolvedTheme),
    setTheme: context.setTheme,
  };
}
