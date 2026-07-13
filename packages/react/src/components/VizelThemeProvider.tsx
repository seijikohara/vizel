import {
  applyVizelTheme,
  createVizelSystemThemeListener,
  getStoredVizelTheme,
  getVizelSystemTheme,
  resolveVizelTheme,
  storeVizelTheme,
  VIZEL_DEFAULT_THEME,
  VIZEL_DEFAULT_THEME_STORAGE_KEY,
  type VizelResolvedTheme,
  type VizelTheme,
  type VizelThemeProviderOptions,
  type VizelThemeState,
} from "@vizel/core";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { VizelThemeContext } from "./VizelThemeContext.tsx";

export interface VizelThemeProviderProps extends VizelThemeProviderOptions {
  /** Children to render */
  children: ReactNode;
}

/**
 * Theme provider component for managing dark mode
 *
 * @example
 * ```tsx
 * <VizelThemeProvider defaultTheme="system">
 *   <App />
 * </VizelThemeProvider>
 * ```
 */
export function VizelThemeProvider({
  children,
  defaultTheme = VIZEL_DEFAULT_THEME,
  storageKey = VIZEL_DEFAULT_THEME_STORAGE_KEY,
  targetSelector,
  disableTransitionOnChange = false,
}: VizelThemeProviderProps) {
  const [theme, setThemeState] = useState<VizelTheme>(() => {
    // Check stored theme first
    const stored = getStoredVizelTheme(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<VizelResolvedTheme>(() => getVizelSystemTheme());

  const resolvedTheme = useMemo(() => resolveVizelTheme(theme, systemTheme), [theme, systemTheme]);

  // Apply theme to DOM
  useEffect(() => {
    applyVizelTheme(resolvedTheme, targetSelector, disableTransitionOnChange);
  }, [resolvedTheme, targetSelector, disableTransitionOnChange]);

  // Listen for system theme changes
  useEffect(() => {
    const controller = createVizelSystemThemeListener((newSystemTheme) => {
      setSystemTheme(newSystemTheme);
    });
    controller.mount();
    return () => controller.unmount();
  }, []);

  const setTheme = useCallback(
    (newTheme: VizelTheme) => {
      setThemeState(newTheme);
      storeVizelTheme(storageKey, newTheme);
    },
    [storageKey]
  );

  const value = useMemo<VizelThemeState>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      setTheme,
    }),
    [theme, resolvedTheme, systemTheme, setTheme]
  );

  return <VizelThemeContext.Provider value={value}>{children}</VizelThemeContext.Provider>;
}
