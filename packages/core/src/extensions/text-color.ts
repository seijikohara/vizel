import type { Extensions } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";

/**
 * Color definition for text color and highlight
 */
export interface VizelColorDefinition {
  /** Display name for the color */
  name: string;
  /** CSS color value */
  color: string;
}

/**
 * Extended text color palette with gradient-like arrangement
 */
export const VIZEL_TEXT_COLORS: VizelColorDefinition[] = [
  // Row 1: Grayscale
  { name: "Default", color: "inherit" },
  { name: "Dark Gray", color: "#374151" },
  { name: "Gray", color: "#6b7280" },
  { name: "Light Gray", color: "#9ca3af" },
  // Row 2: Warm colors
  { name: "Dark Red", color: "#b91c1c" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f97316" },
  { name: "Amber", color: "#f59e0b" },
  // Row 3: Cool colors
  { name: "Yellow", color: "#eab308" },
  { name: "Lime", color: "#84cc16" },
  { name: "Green", color: "#22c55e" },
  { name: "Emerald", color: "#10b981" },
  // Row 4: Blue spectrum
  { name: "Teal", color: "#14b8a6" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Indigo", color: "#6366f1" },
  // Row 5: Purple/Pink spectrum
  { name: "Violet", color: "#8b5cf6" },
  { name: "Purple", color: "#a855f7" },
  { name: "Fuchsia", color: "#d946ef" },
  { name: "Pink", color: "#ec4899" },
];

/**
 * Extended highlight color palette (lighter/pastel colors)
 */
export const VIZEL_HIGHLIGHT_COLORS: VizelColorDefinition[] = [
  // Row 1: Basics
  { name: "None", color: "transparent" },
  { name: "Light Gray", color: "#e5e7eb" },
  { name: "Warm Gray", color: "#e7e5e4" },
  { name: "Cool Gray", color: "#e2e8f0" },
  // Row 2: Warm highlights
  { name: "Light Red", color: "#fecaca" },
  { name: "Light Orange", color: "#fed7aa" },
  { name: "Light Amber", color: "#fde68a" },
  { name: "Yellow", color: "#fef08a" },
  // Row 3: Green highlights
  { name: "Light Lime", color: "#d9f99d" },
  { name: "Light Green", color: "#bbf7d0" },
  { name: "Light Emerald", color: "#a7f3d0" },
  { name: "Light Teal", color: "#99f6e4" },
  // Row 4: Blue highlights
  { name: "Light Cyan", color: "#a5f3fc" },
  { name: "Light Blue", color: "#bfdbfe" },
  { name: "Light Indigo", color: "#c7d2fe" },
  { name: "Light Violet", color: "#ddd6fe" },
  // Row 5: Purple/Pink highlights
  { name: "Light Purple", color: "#e9d5ff" },
  { name: "Light Fuchsia", color: "#f5d0fe" },
  { name: "Light Pink", color: "#fbcfe8" },
  { name: "Light Rose", color: "#fecdd3" },
];

/**
 * Storage key for recent colors
 */
const RECENT_COLORS_KEY = "vizel-recent-colors";
const MAX_RECENT_COLORS = 8;

/**
 * Get recent colors from localStorage
 */
export function getVizelRecentColors(type: "textColor" | "highlight"): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(`${RECENT_COLORS_KEY}-${type}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a color to recent colors
 */
export function addVizelRecentColor(type: "textColor" | "highlight", color: string): void {
  if (typeof window === "undefined") return;
  if (color === "inherit" || color === "transparent") return;

  try {
    const recent = getVizelRecentColors(type);
    const filtered = recent.filter((c) => c !== color);
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(`${RECENT_COLORS_KEY}-${type}`, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Options for text color extensions
 */
export interface VizelTextColorOptions {
  /** Custom text color palette */
  textColors?: VizelColorDefinition[];
  /** Custom highlight color palette */
  highlightColors?: VizelColorDefinition[];
  /** Enable multicolor highlights (allows any color) */
  multicolor?: boolean;
}

/**
 * Create text color and highlight extensions
 */
export function createVizelTextColorExtensions(options: VizelTextColorOptions = {}): Extensions {
  const { multicolor = true } = options;

  return [
    TextStyle,
    Color,
    Highlight.configure({
      multicolor,
    }),
  ];
}
