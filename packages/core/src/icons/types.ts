/**
 * Icon system types for Vizel editor.
 *
 * This module defines the icon names and types used throughout the editor.
 * Framework packages (react, vue, svelte) provide the actual icon implementations
 * using Iconify or other icon libraries.
 */

import type { IconifyIcon } from "@iconify/utils";
import { getIconData, iconToSVG } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json";

/**
 * Icon names used in slash commands and menus.
 * These are semantic names that map to actual icons in framework packages.
 */
export type VizelSlashCommandIconName =
  // Text/Headings
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  // Lists
  | "bulletList"
  | "orderedList"
  | "taskList"
  // Blocks
  | "blockquote"
  | "horizontalRule"
  | "details"
  | "callout"
  | "codeBlock"
  | "table"
  // Media
  | "image"
  | "imageUpload"
  | "embed"
  // Advanced
  | "mathBlock"
  | "mathInline"
  | "mermaid"
  | "graphviz"
  | "mention"
  // Navigation
  | "tableOfContents";

/**
 * Icon names used in node type selector.
 */
export type VizelNodeTypeIconName =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock";

/**
 * Icon names used in table controls.
 */
export type VizelTableIconName =
  | "arrowUp"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "plus"
  | "gripVertical"
  | "gripHorizontal";

/**
 * Icon names used in UI components (SaveIndicator, etc.).
 */
export type VizelUIIconName =
  | "check"
  | "loader"
  | "circle"
  | "warning"
  | "chevronDown"
  | "externalLink"
  | "x";

/**
 * Icon names used in BubbleMenu toolbar.
 */
export type VizelBubbleMenuIconName =
  | "bold"
  | "italic"
  | "strikethrough"
  | "underline"
  | "code"
  | "link"
  | "textColor"
  | "highlighter";

/**
 * Icon names used in Toolbar.
 */
export type VizelToolbarIconName = "undo" | "redo";

/**
 * Icon names used internally in NodeView rendering (drag handle, table controls).
 * These icons are rendered via the injected VizelIconRenderer from framework packages.
 */
export type VizelInternalIconName =
  | "grip"
  | "gripHorizontal"
  | "plusSmall"
  // Table menu icons
  | "arrowUp"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  // Code block icons
  | "listOrdered"
  | "copy"
  | "checkSmall";

/**
 * All icon names used in Vizel.
 */
export type VizelIconName =
  | VizelSlashCommandIconName
  | VizelNodeTypeIconName
  | VizelTableIconName
  | VizelUIIconName
  | VizelBubbleMenuIconName
  | VizelToolbarIconName
  | VizelInternalIconName;

/**
 * Custom icon mappings to override default Iconify icon IDs.
 * Keys are semantic icon names, values are Iconify icon IDs.
 *
 * @example
 * ```ts
 * const customIcons: CustomIconMap = {
 *   heading1: "mdi:format-header-1",
 *   bold: "mdi:format-bold",
 *   // Use any Iconify icon set: Material Design, Heroicons, Phosphor, etc.
 * };
 * ```
 */
export type CustomIconMap = Partial<Record<VizelIconName, string>>;

/**
 * Context value for icon customization.
 * Used by framework-specific icon providers.
 */
export interface VizelIconContextValue {
  /**
   * Custom icon mappings that override default Lucide icons.
   */
  customIcons?: CustomIconMap | undefined;
}

/**
 * Default Iconify icon IDs for each icon name.
 * Uses Lucide icons as the default set.
 * Users can override these by providing their own icon mappings.
 */
export const vizelDefaultIconIds: Record<VizelIconName, string> = {
  // Text/Headings
  heading1: "lucide:heading-1",
  heading2: "lucide:heading-2",
  heading3: "lucide:heading-3",
  heading4: "lucide:heading-4",
  heading5: "lucide:heading-5",
  heading6: "lucide:heading-6",
  // Lists
  bulletList: "lucide:list",
  orderedList: "lucide:list-ordered",
  taskList: "lucide:list-checks",
  // Blocks
  paragraph: "lucide:pilcrow",
  blockquote: "lucide:quote",
  horizontalRule: "lucide:minus",
  details: "lucide:chevron-right",
  callout: "lucide:message-square-warning",
  codeBlock: "lucide:code",
  table: "lucide:table",
  // Media
  image: "lucide:image",
  imageUpload: "lucide:image-up",
  embed: "lucide:link",
  // Advanced
  mathBlock: "lucide:sigma",
  mathInline: "lucide:superscript",
  mermaid: "lucide:git-graph",
  graphviz: "lucide:workflow",
  mention: "lucide:at-sign",
  // Navigation
  tableOfContents: "lucide:list-tree",
  // Table controls
  arrowUp: "lucide:arrow-up",
  arrowDown: "lucide:arrow-down",
  arrowLeft: "lucide:arrow-left",
  arrowRight: "lucide:arrow-right",
  alignLeft: "lucide:align-left",
  alignCenter: "lucide:align-center",
  alignRight: "lucide:align-right",
  plus: "lucide:plus",
  gripVertical: "lucide:grip-vertical",
  gripHorizontal: "lucide:grip-horizontal",
  // UI
  check: "lucide:check",
  loader: "lucide:loader-2",
  circle: "lucide:circle",
  warning: "lucide:alert-triangle",
  chevronDown: "lucide:chevron-down",
  externalLink: "lucide:external-link",
  x: "lucide:x",
  // Toolbar
  undo: "lucide:undo-2",
  redo: "lucide:redo-2",
  // BubbleMenu toolbar
  bold: "lucide:bold",
  italic: "lucide:italic",
  strikethrough: "lucide:strikethrough",
  underline: "lucide:underline",
  code: "lucide:code",
  link: "lucide:link",
  textColor: "lucide:baseline",
  highlighter: "lucide:highlighter",
  // Internal (NodeView rendering)
  grip: "lucide:grip-vertical",
  plusSmall: "lucide:plus",
  listOrdered: "lucide:list-ordered",
  copy: "lucide:copy",
  checkSmall: "lucide:check",
};

/**
 * Get the Iconify icon ID for a given icon name.
 * @param name - The semantic icon name
 * @param customIcons - Optional custom icon mappings to override defaults
 * @returns The Iconify icon ID (e.g., "lucide:heading-1")
 */
export function getVizelIconId(
  name: VizelIconName,
  customIcons?: Partial<Record<VizelIconName, string>>
): string {
  return customIcons?.[name] ?? vizelDefaultIconIds[name];
}

/**
 * Icon renderer function type.
 * Framework packages inject their implementation to render icons as SVG strings.
 */
export type VizelIconRenderer = (name: VizelInternalIconName) => string;

/**
 * Icon renderer options for customization.
 */
export interface VizelIconRendererOptions {
  /** Icon width in pixels */
  width?: number;
  /** Icon height in pixels */
  height?: number;
}

/**
 * Extended icon renderer function type with options support.
 */
export type VizelIconRendererWithOptions = (
  name: VizelInternalIconName,
  options?: VizelIconRendererOptions
) => string;

// Global icon renderer, injected by framework packages
let iconRenderer: VizelIconRendererWithOptions | null = null;

/**
 * Set the icon renderer function.
 * Called by framework packages (react, vue, svelte) to inject their Iconify-based implementation.
 *
 * @example
 * ```typescript
 * // In @vizel/react
 * import { setVizelIconRenderer, vizelDefaultIconIds } from "@vizel/core";
 * import { iconToSVG, getIconData } from "@iconify/utils";
 * import lucideIcons from "@iconify-json/lucide";
 *
 * setVizelIconRenderer((name, options) => {
 *   const iconId = vizelDefaultIconIds[name];
 *   const [, iconName] = iconId.split(":");
 *   const data = getIconData(lucideIcons, iconName);
 *   if (!data) return "";
 *   const svg = iconToSVG(data, { width: options?.width, height: options?.height });
 *   return `<svg ...>${svg.body}</svg>`;
 * });
 * ```
 */
export function setVizelIconRenderer(renderer: VizelIconRendererWithOptions): void {
  iconRenderer = renderer;
}

/**
 * Render an internal icon as an SVG string.
 * Uses the injected renderer from framework packages.
 *
 * @param name - The internal icon name
 * @param options - Optional rendering options (width, height)
 * @returns The SVG string, or empty string if no renderer is set
 */
export function renderVizelIcon(
  name: VizelInternalIconName,
  options?: VizelIconRendererOptions
): string {
  if (!iconRenderer) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Vizel] Icon renderer not set. Call setVizelIconRenderer() from your framework package (@vizel/react, @vizel/vue, or @vizel/svelte).`
      );
    }
    return "";
  }
  return iconRenderer(name, options);
}

/**
 * Render an Iconify icon as an SVG string using Lucide icons.
 * This is the default implementation used by framework packages.
 *
 * @param name - The internal icon name
 * @param options - Optional rendering options (width, height)
 * @returns The SVG string, or empty string if icon not found
 */
export function renderVizelIconSvg(
  name: VizelInternalIconName,
  options?: VizelIconRendererOptions
): string {
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
 * Initialize the Vizel icon renderer with the default Lucide implementation.
 * Call this once when your framework package is loaded.
 *
 * @example
 * ```typescript
 * // In @vizel/react entry point
 * import { initVizelIconRenderer } from "@vizel/core";
 * initVizelIconRenderer();
 * ```
 */
export function initVizelIconRenderer(): void {
  setVizelIconRenderer(renderVizelIconSvg);
}
