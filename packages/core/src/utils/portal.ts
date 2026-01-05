/**
 * Portal utility for rendering components outside the normal DOM hierarchy.
 *
 * This module provides a unified portal container management system
 * for floating UI elements like SlashMenu, BubbleMenu, modals, and tooltips.
 */

/** Portal container ID */
export const VIZEL_PORTAL_ID = "vizel-portal-root";

/** Portal layer z-index values */
export const PORTAL_Z_INDEX = {
  /** Base layer for dropdowns and menus */
  dropdown: 50,
  /** Layer for modals and dialogs */
  modal: 100,
  /** Layer for tooltips (highest priority) */
  tooltip: 150,
} as const;

/** Portal layer type */
export type PortalLayer = keyof typeof PORTAL_Z_INDEX;

/**
 * Get or create the portal container element.
 *
 * This function ensures a single portal container exists in the document,
 * creating one if necessary. The container is appended to document.body.
 *
 * @returns The portal container element
 *
 * @example
 * ```typescript
 * const container = getPortalContainer();
 * container.appendChild(myFloatingElement);
 * ```
 */
export function getPortalContainer(): HTMLElement {
  let container = document.getElementById(VIZEL_PORTAL_ID);

  if (!container) {
    container = document.createElement("div");
    container.id = VIZEL_PORTAL_ID;
    container.setAttribute("data-vizel-portal", "");
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Check if the portal container exists.
 *
 * @returns true if the portal container exists in the document
 */
export function hasPortalContainer(): boolean {
  return document.getElementById(VIZEL_PORTAL_ID) !== null;
}

/**
 * Remove the portal container from the document.
 *
 * This should only be called during cleanup when no more
 * portal content is expected to be rendered.
 */
export function removePortalContainer(): void {
  const container = document.getElementById(VIZEL_PORTAL_ID);
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Create a portal element with proper styling.
 *
 * Creates a container div for portal content with appropriate
 * positioning and z-index based on the specified layer.
 *
 * @param layer - The z-index layer for the portal element
 * @returns A configured portal element
 *
 * @example
 * ```typescript
 * const element = createPortalElement("dropdown");
 * element.appendChild(menuContent);
 * getPortalContainer().appendChild(element);
 * ```
 */
export function createPortalElement(layer: PortalLayer = "dropdown"): HTMLDivElement {
  const element = document.createElement("div");
  element.setAttribute("data-vizel-portal-layer", layer);
  element.style.position = "absolute";
  element.style.top = "0";
  element.style.left = "0";
  element.style.zIndex = String(PORTAL_Z_INDEX[layer]);
  return element;
}

/**
 * Options for mounting portal content.
 */
export interface MountPortalOptions {
  /** The z-index layer for the portal */
  layer?: PortalLayer;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Mount an element to the portal container.
 *
 * @param content - The content element to mount
 * @param options - Mount options
 * @returns The wrapper element that was added to the portal
 *
 * @example
 * ```typescript
 * const wrapper = mountToPortal(menuElement, { layer: "dropdown" });
 * // Later, to unmount:
 * unmountFromPortal(wrapper);
 * ```
 */
export function mountToPortal(
  content: HTMLElement,
  options: MountPortalOptions = {}
): HTMLDivElement {
  const { layer = "dropdown", className } = options;
  const wrapper = createPortalElement(layer);

  if (className) {
    wrapper.className = className;
  }

  wrapper.appendChild(content);
  getPortalContainer().appendChild(wrapper);

  return wrapper;
}

/**
 * Unmount an element from the portal container.
 *
 * @param wrapper - The wrapper element returned by mountToPortal
 */
export function unmountFromPortal(wrapper: HTMLElement): void {
  if (wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper);
  }
}
