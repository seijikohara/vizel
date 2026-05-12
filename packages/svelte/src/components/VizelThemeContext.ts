/**
 * Context key for VizelThemeProvider (internal use only).
 *
 * Kept in a standalone module so consumers (the provider component and the
 * `getVizelTheme` rune) can import the key without pulling in the full
 * provider component.
 */
export const VIZEL_THEME_CONTEXT_KEY = Symbol("VizelThemeContext");
