import type { Extensions } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";

/**
 * Color definition for text color and highlight
 */
export interface ColorDefinition {
  /** Display name for the color */
  name: string;
  /** CSS color value */
  color: string;
}

/**
 * Default text color palette
 */
export const TEXT_COLORS: ColorDefinition[] = [
  { name: "Default", color: "inherit" },
  { name: "Gray", color: "#6b7280" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f97316" },
  { name: "Yellow", color: "#eab308" },
  { name: "Green", color: "#22c55e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Purple", color: "#a855f7" },
];

/**
 * Default highlight color palette
 */
export const HIGHLIGHT_COLORS: ColorDefinition[] = [
  { name: "None", color: "transparent" },
  { name: "Yellow", color: "#fef08a" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Orange", color: "#fed7aa" },
];

/**
 * Options for text color extensions
 */
export interface VizelTextColorOptions {
  /** Custom text color palette */
  textColors?: ColorDefinition[];
  /** Custom highlight color palette */
  highlightColors?: ColorDefinition[];
  /** Enable multicolor highlights (allows any color) */
  multicolor?: boolean;
}

/**
 * Create text color and highlight extensions
 */
export function createTextColorExtensions(options: VizelTextColorOptions = {}): Extensions {
  const { multicolor = true } = options;

  return [
    TextStyle,
    Color,
    Highlight.configure({
      multicolor,
    }),
  ];
}

// Re-export individual extensions for advanced usage
export { Color, Highlight, TextStyle };
