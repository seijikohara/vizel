import type { VizelThemeState } from "@vizel/core";
import type { InjectionKey } from "vue";

/**
 * Injection key for VizelThemeProvider context
 */
export const VizelThemeContextKey: InjectionKey<VizelThemeState> = Symbol("VizelThemeContext");
