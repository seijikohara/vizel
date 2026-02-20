/**
 * Menu positioning utilities for viewport boundary clamping.
 *
 * Ensures fixed-position menus and their submenus stay within
 * the visible viewport area.
 */

export interface MenuPosition {
  x: number;
  y: number;
}

/**
 * Clamps a fixed-position menu's coordinates so it stays within
 * the visible viewport.
 *
 * @param anchorRect - Bounding rect of the anchor element (e.g. drag handle)
 * @param menuWidth - offsetWidth of the menu element
 * @param menuHeight - offsetHeight of the menu element
 * @param gap - Vertical gap between anchor and menu (default 4)
 * @param padding - Minimum distance from viewport edges (default 8)
 * @returns Clamped {x, y} coordinates
 *
 * @example
 * ```ts
 * const rect = handle.getBoundingClientRect();
 * const pos = clampMenuPosition(rect, menu.offsetWidth, menu.offsetHeight);
 * menu.style.left = `${pos.x}px`;
 * menu.style.top = `${pos.y}px`;
 * ```
 */
export function clampMenuPosition(
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
  gap = 4,
  padding = 8
): MenuPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = anchorRect.left;
  let y = anchorRect.bottom + gap;

  // Clamp horizontal: prevent overflow on right edge
  if (x + menuWidth > vw - padding) {
    x = vw - menuWidth - padding;
  }
  // Clamp horizontal: prevent overflow on left edge
  if (x < padding) {
    x = padding;
  }

  // Clamp vertical: if menu overflows bottom, flip above anchor
  if (y + menuHeight > vh - padding) {
    y = anchorRect.top - menuHeight - gap;
  }
  // Clamp vertical: prevent overflow on top edge
  if (y < padding) {
    y = padding;
  }

  return { x, y };
}

/**
 * Determines whether a submenu should open to the left instead of the right.
 *
 * @param parentRect - Bounding rect of the parent menu element
 * @param submenuWidth - offsetWidth of the submenu (estimate 200 if unknown)
 * @param gap - Horizontal gap between parent and submenu (default 4)
 * @param padding - Minimum distance from viewport edge (default 8)
 * @returns true if submenu should flip to the left side
 *
 * @example
 * ```ts
 * const parentRect = parentMenu.getBoundingClientRect();
 * const flip = shouldFlipSubmenu(parentRect, 200);
 * submenu.classList.toggle("vizel-block-menu-submenu--left", flip);
 * ```
 */
export function shouldFlipSubmenu(
  parentRect: DOMRect,
  submenuWidth: number,
  gap = 4,
  padding = 8
): boolean {
  const vw = window.innerWidth;
  return parentRect.right + gap + submenuWidth > vw - padding;
}
