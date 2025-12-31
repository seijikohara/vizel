/**
 * Theme utilities for Vizel editor
 *
 * Provides dark mode support with system preference detection and manual toggle.
 */

/**
 * Available theme options
 */
export type Theme = "light" | "dark" | "system";

/**
 * Resolved theme (actual applied theme)
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Default theme configuration
 */
export const DEFAULT_THEME: Theme = "system";

/**
 * Default storage key for persisting theme preference
 */
export const DEFAULT_THEME_STORAGE_KEY = "vizel-theme";

/**
 * Data attribute used for theme application
 */
export const THEME_DATA_ATTRIBUTE = "data-vizel-theme";

/**
 * Theme provider options
 */
export interface ThemeProviderOptions {
  /** Default theme (default: "system") */
  defaultTheme?: Theme;
  /** Storage key for persisting theme (default: "vizel-theme") */
  storageKey?: string;
  /** Target element to apply theme attribute (default: document.documentElement) */
  targetSelector?: string;
  /** Disable theme transitions during initial load */
  disableTransitionOnChange?: boolean;
}

/**
 * Theme state returned by useTheme hooks
 */
export interface ThemeState {
  /** Current theme setting */
  theme: Theme;
  /** Resolved theme (actual applied theme) */
  resolvedTheme: ResolvedTheme;
  /** System theme preference */
  systemTheme: ResolvedTheme;
  /** Set theme */
  setTheme: (theme: Theme) => void;
}

/**
 * Get the system theme preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Resolve theme to actual applied theme
 */
export function resolveTheme(theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme {
  if (theme === "system") {
    return systemTheme;
  }
  return theme;
}

/**
 * Get stored theme from storage
 */
export function getStoredTheme(storageKey: string): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Storage not available
  }
  return null;
}

/**
 * Store theme to storage
 */
export function storeTheme(storageKey: string, theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Storage not available
  }
}

/**
 * Apply theme to target element
 */
export function applyTheme(
  resolvedTheme: ResolvedTheme,
  targetSelector?: string,
  disableTransition?: boolean
): void {
  if (typeof document === "undefined") {
    return;
  }

  const target = targetSelector ? document.querySelector(targetSelector) : document.documentElement;

  if (!target) {
    return;
  }

  // Disable transitions during theme change if requested
  if (disableTransition) {
    const css = document.createElement("style");
    css.appendChild(
      document.createTextNode(
        `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
      )
    );
    document.head.appendChild(css);

    // Force repaint by reading computed style
    (() => window.getComputedStyle(document.body))();

    // Re-enable transitions after a tick
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  }

  target.setAttribute(THEME_DATA_ATTRIBUTE, resolvedTheme);
}

/**
 * Create a media query listener for system theme changes
 */
export function createSystemThemeListener(callback: (theme: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined") {
    // SSR: return no-op cleanup function
    return () => {
      /* no-op */
    };
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}

/**
 * Initialize theme on page load (for SSR/hydration)
 *
 * Call this in a script tag in the head to prevent flash of incorrect theme.
 *
 * @example
 * ```html
 * <script>
 *   (function() {
 *     const storageKey = 'vizel-theme';
 *     const stored = localStorage.getItem(storageKey);
 *     const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 *     const theme = stored === 'dark' ? 'dark' :
 *                   stored === 'light' ? 'light' :
 *                   systemDark ? 'dark' : 'light';
 *     document.documentElement.setAttribute('data-vizel-theme', theme);
 *   })();
 * </script>
 * ```
 */
export function getThemeInitScript(storageKey: string = DEFAULT_THEME_STORAGE_KEY): string {
  return `(function(){try{var s=localStorage.getItem('${storageKey}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='dark'?'dark':s==='light'?'light':d?'dark':'light';document.documentElement.setAttribute('${THEME_DATA_ATTRIBUTE}',t)}catch(e){}})()`;
}
