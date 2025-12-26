import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that BubbleMenuDivider renders with correct base class
 */
export async function testDividerRendersWithBaseClass(
  _component: Locator,
  page: Page
): Promise<void> {
  const divider = page.locator(".vizel-bubble-menu-divider");
  await expect(divider).toHaveCount(1);
  await expect(divider).toHaveClass(/vizel-bubble-menu-divider/);
}

/**
 * Test that BubbleMenuDivider accepts custom class
 */
export async function testDividerAcceptsCustomClass(
  _component: Locator,
  page: Page
): Promise<void> {
  const divider = page.locator(".vizel-bubble-menu-divider");
  await expect(divider).toHaveCount(1);
  await expect(divider).toHaveClass(/custom-divider/);
}

/**
 * Test that BubbleMenuDivider is a span element
 */
export async function testDividerIsSpanElement(_component: Locator, page: Page): Promise<void> {
  const divider = page.locator("span.vizel-bubble-menu-divider");
  await expect(divider).toHaveCount(1);
}
