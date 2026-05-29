/**
 * Submenu flip utility for viewport boundary handling.
 *
 * Keeps a Cascading Style Sheets (CSS) flyout submenu within the visible
 * viewport by reporting when the submenu must open to the left. The block
 * menu positions its body through `@vizel/headless`'s floating controller;
 * only the submenu, a CSS-positioned child, still needs this helper.
 */

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
