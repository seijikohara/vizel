import type { VizelThemeState } from "@vizel/core";
import { setContext } from "svelte";

/**
 * Context key for VizelThemeProvider (internal use only).
 *
 * Kept in a standalone module so consumers (the provider component and the
 * `getVizelTheme` rune) can import the key without pulling in the full
 * provider component.
 */
export const VIZEL_THEME_CONTEXT_KEY = Symbol("VizelThemeContext");

/**
 * Publish the theme state to descendants through Svelte context.
 *
 * Call this typed wrapper instead of `setContext(VIZEL_THEME_CONTEXT_KEY,
 * ...)` so the key and the `VizelThemeState` value type stay paired.
 * `getVizelTheme` reads the same context. The wrapper mirrors the editor
 * context's `setVizelContext` idiom (ADR-0004) so no provider calls
 * `setContext` with a raw key.
 *
 * @param state - Reactive theme state exposing `theme`, `resolvedTheme`,
 *   `systemTheme`, and `setTheme`.
 * @returns The state, so a caller can publish and reuse it in one
 *   expression.
 */
export function setVizelThemeContext(state: VizelThemeState): VizelThemeState {
  return setContext(VIZEL_THEME_CONTEXT_KEY, state);
}
