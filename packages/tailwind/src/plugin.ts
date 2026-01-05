/**
 * Vizel Tailwind CSS Plugin
 *
 * Provides Tailwind CSS integration for Vizel editor components.
 *
 * @example
 * ```ts
 * // tailwind.config.ts
 * import { vizelPlugin } from '@vizel/tailwind';
 *
 * export default {
 *   plugins: [vizelPlugin],
 * };
 * ```
 */

import plugin from "tailwindcss/plugin";

/**
 * Vizel color palette configuration
 */
const vizelColors = {
  primary: {
    DEFAULT: "var(--vizel-primary)",
    hover: "var(--vizel-primary-hover)",
    active: "var(--vizel-primary-active)",
    foreground: "var(--vizel-primary-foreground)",
  },
  secondary: {
    DEFAULT: "var(--vizel-secondary)",
    hover: "var(--vizel-secondary-hover)",
    foreground: "var(--vizel-secondary-foreground)",
  },
  background: {
    DEFAULT: "var(--vizel-background)",
    secondary: "var(--vizel-background-secondary)",
    tertiary: "var(--vizel-background-tertiary)",
  },
  foreground: {
    DEFAULT: "var(--vizel-foreground)",
    secondary: "var(--vizel-foreground-secondary)",
    muted: "var(--vizel-foreground-muted)",
  },
  muted: {
    DEFAULT: "var(--vizel-muted)",
    foreground: "var(--vizel-muted-foreground)",
  },
  accent: {
    DEFAULT: "var(--vizel-accent)",
    foreground: "var(--vizel-accent-foreground)",
  },
  border: {
    DEFAULT: "var(--vizel-border)",
    hover: "var(--vizel-border-hover)",
    focus: "var(--vizel-border-focus)",
  },
  ring: {
    DEFAULT: "var(--vizel-ring)",
    offset: "var(--vizel-ring-offset)",
  },
  success: {
    DEFAULT: "var(--vizel-success)",
    foreground: "var(--vizel-success-foreground)",
  },
  warning: {
    DEFAULT: "var(--vizel-warning)",
    foreground: "var(--vizel-warning-foreground)",
  },
  error: {
    DEFAULT: "var(--vizel-error)",
    foreground: "var(--vizel-error-foreground)",
  },
  destructive: {
    DEFAULT: "var(--vizel-destructive)",
    foreground: "var(--vizel-destructive-foreground)",
  },
} as const;

/**
 * Vizel border radius configuration
 */
const vizelBorderRadius = {
  none: "var(--vizel-radius-none)",
  sm: "var(--vizel-radius-sm)",
  DEFAULT: "var(--vizel-radius-md)",
  md: "var(--vizel-radius-md)",
  lg: "var(--vizel-radius-lg)",
  xl: "var(--vizel-radius-xl)",
  "2xl": "var(--vizel-radius-2xl)",
  full: "var(--vizel-radius-full)",
} as const;

/**
 * Vizel shadow configuration
 */
const vizelBoxShadow = {
  sm: "var(--vizel-shadow-sm)",
  DEFAULT: "var(--vizel-shadow-md)",
  md: "var(--vizel-shadow-md)",
  lg: "var(--vizel-shadow-lg)",
  xl: "var(--vizel-shadow-xl)",
  "2xl": "var(--vizel-shadow-2xl)",
} as const;

/**
 * Vizel font family configuration
 */
const vizelFontFamily = {
  sans: "var(--vizel-font-sans)",
  serif: "var(--vizel-font-serif)",
  mono: "var(--vizel-font-mono)",
} as const;

/**
 * Vizel font size configuration
 */
const vizelFontSize = {
  xs: "var(--vizel-font-size-xs)",
  sm: "var(--vizel-font-size-sm)",
  base: "var(--vizel-font-size-base)",
  lg: "var(--vizel-font-size-lg)",
  xl: "var(--vizel-font-size-xl)",
  "2xl": "var(--vizel-font-size-2xl)",
  "3xl": "var(--vizel-font-size-3xl)",
  "4xl": "var(--vizel-font-size-4xl)",
} as const;

/**
 * Vizel Tailwind CSS plugin
 */
export const vizelPlugin = plugin(
  ({ addBase, addComponents }) => {
    // Add base styles
    addBase({
      ":root": {
        "--vizel-primary": "#3b82f6",
        "--vizel-primary-hover": "#2563eb",
        "--vizel-primary-active": "#1d4ed8",
        "--vizel-primary-foreground": "#ffffff",
        "--vizel-secondary": "#64748b",
        "--vizel-secondary-hover": "#475569",
        "--vizel-secondary-foreground": "#ffffff",
        "--vizel-background": "#ffffff",
        "--vizel-background-secondary": "#f9fafb",
        "--vizel-background-tertiary": "#f3f4f6",
        "--vizel-foreground": "#111827",
        "--vizel-foreground-secondary": "#6b7280",
        "--vizel-foreground-muted": "#9ca3af",
        "--vizel-muted": "#f3f4f6",
        "--vizel-muted-foreground": "#6b7280",
        "--vizel-accent": "#f3f4f6",
        "--vizel-accent-foreground": "#111827",
        "--vizel-border": "#e5e7eb",
        "--vizel-border-hover": "#d1d5db",
        "--vizel-border-focus": "var(--vizel-primary)",
        "--vizel-ring": "var(--vizel-primary)",
        "--vizel-ring-offset": "var(--vizel-background)",
        "--vizel-success": "#10b981",
        "--vizel-success-foreground": "#ffffff",
        "--vizel-warning": "#f59e0b",
        "--vizel-warning-foreground": "#ffffff",
        "--vizel-error": "#ef4444",
        "--vizel-error-foreground": "#ffffff",
        "--vizel-destructive": "#dc2626",
        "--vizel-destructive-foreground": "#ffffff",
        "--vizel-radius-none": "0",
        "--vizel-radius-sm": "0.25rem",
        "--vizel-radius-md": "0.375rem",
        "--vizel-radius-lg": "0.5rem",
        "--vizel-radius-xl": "0.75rem",
        "--vizel-radius-2xl": "1rem",
        "--vizel-radius-full": "9999px",
        "--vizel-shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "--vizel-shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "--vizel-shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "--vizel-shadow-xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "--vizel-shadow-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "--vizel-font-sans":
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "--vizel-font-serif": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        "--vizel-font-mono":
          "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
        "--vizel-font-size-xs": "0.75rem",
        "--vizel-font-size-sm": "0.875rem",
        "--vizel-font-size-base": "1rem",
        "--vizel-font-size-lg": "1.125rem",
        "--vizel-font-size-xl": "1.25rem",
        "--vizel-font-size-2xl": "1.5rem",
        "--vizel-font-size-3xl": "1.875rem",
        "--vizel-font-size-4xl": "2.25rem",
      },
      ".dark, [data-vizel-theme='dark']": {
        "--vizel-primary": "#60a5fa",
        "--vizel-primary-hover": "#3b82f6",
        "--vizel-primary-active": "#2563eb",
        "--vizel-primary-foreground": "#111827",
        "--vizel-secondary": "#94a3b8",
        "--vizel-secondary-hover": "#cbd5e1",
        "--vizel-secondary-foreground": "#111827",
        "--vizel-background": "#1f2937",
        "--vizel-background-secondary": "#111827",
        "--vizel-background-tertiary": "#374151",
        "--vizel-foreground": "#f9fafb",
        "--vizel-foreground-secondary": "#d1d5db",
        "--vizel-foreground-muted": "#9ca3af",
        "--vizel-muted": "#374151",
        "--vizel-muted-foreground": "#9ca3af",
        "--vizel-accent": "#374151",
        "--vizel-accent-foreground": "#f9fafb",
        "--vizel-border": "#374151",
        "--vizel-border-hover": "#4b5563",
        "--vizel-success": "#34d399",
        "--vizel-warning": "#fbbf24",
        "--vizel-error": "#f87171",
        "--vizel-destructive": "#f87171",
        "--vizel-shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
        "--vizel-shadow-md": "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
        "--vizel-shadow-lg": "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
        "--vizel-shadow-xl": "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
        "--vizel-shadow-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.5)",
      },
    });

    // Add component styles
    addComponents({
      ".vizel-editor": {
        fontFamily: "var(--vizel-font-sans)",
        fontSize: "var(--vizel-font-size-base)",
        lineHeight: "1.625",
        color: "var(--vizel-foreground)",
        backgroundColor: "var(--vizel-background)",
      },
      ".vizel-bubble-menu": {
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.25rem",
        backgroundColor: "var(--vizel-background)",
        borderRadius: "var(--vizel-radius-lg)",
        border: "1px solid var(--vizel-border)",
        boxShadow: "var(--vizel-shadow-lg)",
      },
      ".vizel-bubble-menu-button": {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.375rem",
        borderRadius: "var(--vizel-radius-md)",
        color: "var(--vizel-foreground-secondary)",
        transition: "all 150ms ease",
        "&:hover": {
          backgroundColor: "var(--vizel-accent)",
          color: "var(--vizel-accent-foreground)",
        },
        "&[data-active='true']": {
          backgroundColor: "var(--vizel-primary)",
          color: "var(--vizel-primary-foreground)",
        },
      },
      ".vizel-slash-menu": {
        minWidth: "200px",
        maxHeight: "300px",
        overflow: "auto",
        backgroundColor: "var(--vizel-background)",
        borderRadius: "var(--vizel-radius-lg)",
        border: "1px solid var(--vizel-border)",
        boxShadow: "var(--vizel-shadow-lg)",
      },
      ".vizel-slash-menu-item": {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        cursor: "pointer",
        transition: "background-color 150ms ease",
        "&:hover, &[data-selected='true']": {
          backgroundColor: "var(--vizel-accent)",
        },
      },
    });
  },
  {
    theme: {
      extend: {
        colors: {
          vizel: vizelColors,
        },
        borderRadius: {
          vizel: vizelBorderRadius,
        },
        boxShadow: {
          vizel: vizelBoxShadow,
        },
        fontFamily: {
          vizel: vizelFontFamily,
        },
        fontSize: {
          vizel: vizelFontSize,
        },
      },
    },
  }
);
