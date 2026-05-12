import type { VizelThemeState } from "@vizel/core";
import { createContext } from "react";

/**
 * React context that exposes the active Vizel theme state to descendants of
 * `VizelThemeProvider`. Consumers use the {@link useVizelTheme} and
 * {@link useVizelThemeSafe} hooks rather than reading the context directly.
 */
export const VizelThemeContext = createContext<VizelThemeState | null>(null);
