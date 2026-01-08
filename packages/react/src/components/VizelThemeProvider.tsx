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
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface VizelThemeProviderProps extends VizelThemeProviderOptions {
  /** Children to render */
  children: ReactNode;
}

const VizelThemeContext = createContext<VizelThemeState | null>(null);

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
    const cleanup = createVizelSystemThemeListener((newSystemTheme) => {
      setSystemTheme(newSystemTheme);
    });

    return cleanup;
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

/**
 * Hook to access theme state and controls
 *
 * Must be used within a VizelThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useVizelTheme();
 *
 * return (
 *   <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *     Toggle theme
 *   </button>
 * );
 * ```
 */
export function useVizelTheme(): VizelThemeState {
  const context = useContext(VizelThemeContext);

  if (!context) {
    throw new Error(
      "[Vizel] useVizelTheme must be used within a VizelThemeProvider.\n" +
        "Example:\n" +
        "  <VizelThemeProvider>\n" +
        "    <YourComponent />\n" +
        "  </VizelThemeProvider>"
    );
  }

  return context;
}

/**
 * Hook to access theme state safely (returns null if not in provider)
 */
export function useVizelThemeSafe(): VizelThemeState | null {
  return useContext(VizelThemeContext);
}
