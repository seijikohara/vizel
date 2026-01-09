/**
 * Icon renderer implementation for Vue package.
 * Uses Iconify utilities to render SVG strings from icon data.
 */

import type { IconifyIcon } from "@iconify/utils";
import { getIconData, iconToSVG } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json";
import {
  setVizelIconRenderer,
  type VizelIconRendererOptions,
  type VizelInternalIconName,
  vizelDefaultIconIds,
} from "@vizel/core";

/**
 * Render an Iconify icon as an SVG string.
 */
function renderIconSvg(name: VizelInternalIconName, options?: VizelIconRendererOptions): string {
  const iconId = vizelDefaultIconIds[name];
  if (!iconId) return "";

  // Parse icon ID (format: "prefix:name")
  const [, iconName] = iconId.split(":");
  if (!iconName) return "";

  // Get icon data from the Lucide icon set
  const iconData = getIconData(lucide, iconName) as IconifyIcon | null;
  if (!iconData) return "";

  // Convert icon data to SVG
  const result = iconToSVG(iconData, {
    height: options?.height ?? 24,
    width: options?.width ?? 24,
  });

  // Build SVG element
  const attrs: string[] = [
    'xmlns="http://www.w3.org/2000/svg"',
    `width="${options?.width ?? 24}"`,
    `height="${options?.height ?? 24}"`,
    `viewBox="0 0 ${iconData.width ?? 24} ${iconData.height ?? 24}"`,
  ];

  // Add additional attributes from the result
  if (result.attributes) {
    for (const [key, value] of Object.entries(result.attributes)) {
      if (!["width", "height", "viewBox"].includes(key)) {
        attrs.push(`${key}="${value}"`);
      }
    }
  }

  return `<svg ${attrs.join(" ")}>${result.body}</svg>`;
}

/**
 * Initialize the icon renderer for the Vue package.
 * This should be called once when the package is loaded.
 */
export function initIconRenderer(): void {
  setVizelIconRenderer(renderIconSvg);
}

// Auto-initialize when this module is imported
initIconRenderer();
