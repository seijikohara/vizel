import {
  applyTheme,
  createSystemThemeListener,
  DEFAULT_THEME,
  DEFAULT_THEME_STORAGE_KEY,
  getStoredTheme,
  getSystemTheme,
  type ResolvedTheme,
  resolveTheme,
  storeTheme,
  type Theme,
  type ThemeProviderOptions,
  type ThemeState,
} from "@vizel/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface ThemeProviderProps extends ThemeProviderOptions {
  /** Children to render */
  children: ReactNode;
}

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Theme provider component for managing dark mode
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  targetSelector,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check stored theme first
    const stored = getStoredTheme(storageKey);
    if (stored) {
      return stored;
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = useMemo(() => resolveTheme(theme, systemTheme), [theme, systemTheme]);

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(resolvedTheme, targetSelector, disableTransitionOnChange);
  }, [resolvedTheme, targetSelector, disableTransitionOnChange]);

  // Listen for system theme changes
  useEffect(() => {
    const cleanup = createSystemThemeListener((newSystemTheme) => {
      setSystemTheme(newSystemTheme);
    });

    return cleanup;
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      storeTheme(storageKey, newTheme);
    },
    [storageKey]
  );

  const value = useMemo<ThemeState>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      setTheme,
    }),
    [theme, resolvedTheme, systemTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme state and controls
 *
 * Must be used within a ThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useTheme();
 *
 * return (
 *   <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *     Toggle theme
 *   </button>
 * );
 * ```
 */
export function useTheme(): ThemeState {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

/**
 * Hook to access theme state safely (returns null if not in provider)
 */
export function useThemeSafe(): ThemeState | null {
  return useContext(ThemeContext);
}
