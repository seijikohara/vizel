import type { VizelThemeState } from "@vizel/core";
import type { InjectionKey } from "vue";

/**
 * Injection key for VizelThemeProvider context (internal use only)
 */
export const VIZEL_THEME_CONTEXT_KEY: InjectionKey<VizelThemeState> = Symbol("VizelThemeContext");
