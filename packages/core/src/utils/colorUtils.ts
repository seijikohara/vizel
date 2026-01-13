/**
 * Color utilities for Vizel editor.
 *
 * These utilities help with validating and normalizing hex color values.
 */

/**
 * Validate if a string is a valid hex color.
 *
 * @param color - The color string to validate
 * @returns True if the color is a valid hex color (3 or 6 digits)
 *
 * @example
 * ```ts
 * isVizelValidHexColor("#FF0000"); // true
 * isVizelValidHexColor("#F00");    // true
 * isVizelValidHexColor("#GGGGGG"); // false
 * isVizelValidHexColor("red");     // false
 * ```
 */
export function isVizelValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Normalize a hex color string to standard format (#RRGGBB uppercase).
 * Handles shorthand (#RGB) conversion and adds # prefix if missing.
 *
 * @param color - The color string to normalize
 * @returns Normalized uppercase hex color string
 *
 * @example
 * ```ts
 * normalizeVizelHexColor("#f00");    // "#FF0000"
 * normalizeVizelHexColor("#FF0000"); // "#FF0000"
 * normalizeVizelHexColor("ff0000");  // "#FF0000"
 * ```
 */
export function normalizeVizelHexColor(color: string): string {
  const trimmed = color.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  // Handle shorthand hex (#RGB -> #RRGGBB)
  if (withHash.length === 4) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return withHash.toUpperCase();
}
