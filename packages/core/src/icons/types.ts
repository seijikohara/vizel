/**
 * Icon system types for Vizel editor.
 *
 * This module defines the icon names and types used throughout the editor.
 * Framework packages (react, vue, svelte) provide the actual icon implementations
 * using Iconify or other icon libraries.
 */

/**
 * Icon names used in slash commands and menus.
 * These are semantic names that map to actual icons in framework packages.
 */
export type SlashCommandIconName =
  // Text/Headings
  | "heading1"
  | "heading2"
  | "heading3"
  // Lists
  | "bulletList"
  | "orderedList"
  | "taskList"
  // Blocks
  | "blockquote"
  | "horizontalRule"
  | "details"
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
  | "graphviz";

/**
 * Icon names used in node type selector.
 */
export type NodeTypeIconName =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock";

/**
 * Icon names used in table controls.
 */
export type TableIconName =
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
export type UIIconName = "check" | "loader" | "circle" | "warning" | "chevronDown" | "x";

/**
 * Icon names used in BubbleMenu toolbar.
 */
export type BubbleMenuIconName =
  | "bold"
  | "italic"
  | "strikethrough"
  | "underline"
  | "code"
  | "link"
  | "textColor"
  | "highlighter";

/**
 * Icon names used internally in NodeView rendering (drag handle, table controls).
 * These icons are rendered via the injected IconRenderer from framework packages.
 */
export type InternalIconName =
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
  | "listOrdered";

/**
 * All icon names used in Vizel.
 */
export type IconName =
  | SlashCommandIconName
  | NodeTypeIconName
  | TableIconName
  | UIIconName
  | BubbleMenuIconName
  | InternalIconName;

/**
 * Default Iconify icon IDs for each icon name.
 * Uses Lucide icons as the default set.
 * Users can override these by providing their own icon mappings.
 */
export const defaultIconIds: Record<IconName, string> = {
  // Text/Headings
  heading1: "lucide:heading-1",
  heading2: "lucide:heading-2",
  heading3: "lucide:heading-3",
  // Lists
  bulletList: "lucide:list",
  orderedList: "lucide:list-ordered",
  taskList: "lucide:list-checks",
  // Blocks
  paragraph: "lucide:pilcrow",
  blockquote: "lucide:quote",
  horizontalRule: "lucide:minus",
  details: "lucide:chevron-right",
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
  x: "lucide:x",
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
};

/**
 * Get the Iconify icon ID for a given icon name.
 * @param name - The semantic icon name
 * @param customIcons - Optional custom icon mappings to override defaults
 * @returns The Iconify icon ID (e.g., "lucide:heading-1")
 */
export function getIconId(name: IconName, customIcons?: Partial<Record<IconName, string>>): string {
  return customIcons?.[name] ?? defaultIconIds[name];
}

/**
 * Icon renderer function type.
 * Framework packages inject their implementation to render icons as SVG strings.
 */
export type IconRenderer = (name: InternalIconName) => string;

/**
 * Icon renderer options for customization.
 */
export interface IconRendererOptions {
  /** Icon width in pixels */
  width?: number;
  /** Icon height in pixels */
  height?: number;
}

/**
 * Extended icon renderer function type with options support.
 */
export type IconRendererWithOptions = (
  name: InternalIconName,
  options?: IconRendererOptions
) => string;

// Global icon renderer, injected by framework packages
let iconRenderer: IconRendererWithOptions | null = null;

/**
 * Set the icon renderer function.
 * Called by framework packages (react, vue, svelte) to inject their Iconify-based implementation.
 *
 * @example
 * ```typescript
 * // In @vizel/react
 * import { setIconRenderer, defaultIconIds } from "@vizel/core";
 * import { iconToSVG, getIconData } from "@iconify/utils";
 * import lucideIcons from "@iconify-json/lucide";
 *
 * setIconRenderer((name, options) => {
 *   const iconId = defaultIconIds[name];
 *   const [, iconName] = iconId.split(":");
 *   const data = getIconData(lucideIcons, iconName);
 *   if (!data) return "";
 *   const svg = iconToSVG(data, { width: options?.width, height: options?.height });
 *   return `<svg ...>${svg.body}</svg>`;
 * });
 * ```
 */
export function setIconRenderer(renderer: IconRendererWithOptions): void {
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
export function renderIcon(name: InternalIconName, options?: IconRendererOptions): string {
  if (!iconRenderer) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Vizel] Icon renderer not set. Call setIconRenderer() from your framework package (@vizel/react, @vizel/vue, or @vizel/svelte).`
      );
    }
    return "";
  }
  return iconRenderer(name, options);
}
