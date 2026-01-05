/**
 * Vizel Tailwind CSS Preset
 *
 * A complete Tailwind CSS preset for Vizel editor.
 * Includes the plugin and recommended configuration.
 *
 * @example
 * ```ts
 * // tailwind.config.ts
 * import { vizelPreset } from '@vizel/tailwind/preset';
 *
 * export default {
 *   presets: [vizelPreset],
 *   // ... your config
 * };
 * ```
 */

import type { Config } from "tailwindcss";
import { vizelPlugin } from "./plugin.js";

/**
 * Vizel Tailwind CSS Preset
 */
export const vizelPreset: Partial<Config> = {
  plugins: [vizelPlugin],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--vizel-foreground)",
            "--tw-prose-headings": "var(--vizel-foreground)",
            "--tw-prose-lead": "var(--vizel-foreground-secondary)",
            "--tw-prose-links": "var(--vizel-primary)",
            "--tw-prose-bold": "var(--vizel-foreground)",
            "--tw-prose-counters": "var(--vizel-foreground-secondary)",
            "--tw-prose-bullets": "var(--vizel-foreground-muted)",
            "--tw-prose-hr": "var(--vizel-border)",
            "--tw-prose-quotes": "var(--vizel-foreground)",
            "--tw-prose-quote-borders": "var(--vizel-border)",
            "--tw-prose-captions": "var(--vizel-foreground-secondary)",
            "--tw-prose-code": "var(--vizel-foreground)",
            "--tw-prose-pre-code": "var(--vizel-foreground)",
            "--tw-prose-pre-bg": "var(--vizel-background-tertiary)",
            "--tw-prose-th-borders": "var(--vizel-border)",
            "--tw-prose-td-borders": "var(--vizel-border)",
            // Invert colors for dark mode
            "--tw-prose-invert-body": "var(--vizel-foreground)",
            "--tw-prose-invert-headings": "var(--vizel-foreground)",
            "--tw-prose-invert-lead": "var(--vizel-foreground-secondary)",
            "--tw-prose-invert-links": "var(--vizel-primary)",
            "--tw-prose-invert-bold": "var(--vizel-foreground)",
            "--tw-prose-invert-counters": "var(--vizel-foreground-secondary)",
            "--tw-prose-invert-bullets": "var(--vizel-foreground-muted)",
            "--tw-prose-invert-hr": "var(--vizel-border)",
            "--tw-prose-invert-quotes": "var(--vizel-foreground)",
            "--tw-prose-invert-quote-borders": "var(--vizel-border)",
            "--tw-prose-invert-captions": "var(--vizel-foreground-secondary)",
            "--tw-prose-invert-code": "var(--vizel-foreground)",
            "--tw-prose-invert-pre-code": "var(--vizel-foreground)",
            "--tw-prose-invert-pre-bg": "var(--vizel-background-tertiary)",
            "--tw-prose-invert-th-borders": "var(--vizel-border)",
            "--tw-prose-invert-td-borders": "var(--vizel-border)",
          },
        },
      },
    },
  },
};
