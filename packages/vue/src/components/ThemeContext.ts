import type { ThemeState } from "@vizel/core";
import type { InjectionKey } from "vue";

/**
 * Injection key for ThemeProvider context
 */
export const ThemeContextKey: InjectionKey<ThemeState> = Symbol("ThemeContext");
