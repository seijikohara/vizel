import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for block menu functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Helper to open block menu by clicking the drag handle */
async function openBlockMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type some content
  await page.keyboard.type("Test paragraph");

  // Hover to show drag handle
  const paragraph = editor.locator("p").first();
  await paragraph.hover();

  const dragHandle = page.locator(".vizel-drag-handle");
  await expect(dragHandle).toBeVisible({ timeout: 2000 });

  // Click the drag handle to open block menu
  await dragHandle.click();
}

/** Verify block menu appears when clicking the drag handle */
export async function testBlockMenuOpensOnClick(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });
}

/** Verify block menu has correct ARIA attributes */
export async function testBlockMenuAccessibility(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Check menu role
  await expect(blockMenu).toHaveAttribute("role", "menu");

  // Check menu items have correct role
  const menuItems = blockMenu.locator("[role='menuitem']");
  const count = await menuItems.count();
  expect(count).toBeGreaterThan(0);
}

/** Verify block menu has Delete, Duplicate, Copy, Cut, and Turn into options */
export async function testBlockMenuDefaultActions(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Check for default actions
  await expect(
    blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Delete" })
  ).toBeVisible();
  await expect(
    blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Duplicate" })
  ).toBeVisible();
  await expect(
    blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Copy" })
  ).toBeVisible();
  await expect(blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Cut" })).toBeVisible();
  await expect(
    blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Turn into" })
  ).toBeVisible();
}

/** Verify block menu closes on Escape key */
export async function testBlockMenuClosesOnEscape(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Press Escape to close
  await page.keyboard.press("Escape");

  await expect(blockMenu).not.toBeVisible();
}

/** Verify block menu closes on outside click */
export async function testBlockMenuClosesOnOutsideClick(
  component: Locator,
  page: Page
): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Click outside the menu
  await page.mouse.click(10, 10);

  await expect(blockMenu).not.toBeVisible();
}

/** Verify Delete action removes the block */
export async function testBlockMenuDeleteAction(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  const editor = component.locator(".vizel-editor");

  // Click Delete
  await blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Delete" }).click();

  // Menu should close
  await expect(blockMenu).not.toBeVisible();

  // Block should be deleted (paragraph text should be gone)
  await expect(editor.locator("p", { hasText: "Test paragraph" })).not.toBeVisible();
}

/** Verify Duplicate action copies the block */
export async function testBlockMenuDuplicateAction(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  const editor = component.locator(".vizel-editor");

  // Click Duplicate
  await blockMenu.locator(".vizel-block-menu-item-label", { hasText: "Duplicate" }).click();

  // Menu should close
  await expect(blockMenu).not.toBeVisible();

  // There should now be two paragraphs with the same text
  const paragraphs = editor.locator("p", { hasText: "Test paragraph" });
  await expect(paragraphs).toHaveCount(2);
}

/** Verify Turn into submenu appears */
export async function testBlockMenuTurnIntoSubmenu(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Hover over Turn into to show submenu
  const turnIntoTrigger = blockMenu.locator(".vizel-block-menu-submenu-trigger");
  await turnIntoTrigger.hover();

  // Submenu should appear
  const submenu = blockMenu.locator(".vizel-block-menu-submenu");
  await expect(submenu).toBeVisible({ timeout: 2000 });

  // Should have node type options
  const submenuItems = submenu.locator("[role='menuitem']");
  const count = await submenuItems.count();
  expect(count).toBeGreaterThan(0);
}

/** Verify Turn into Heading converts the block */
export async function testBlockMenuTurnIntoHeading(component: Locator, page: Page): Promise<void> {
  await openBlockMenu(component, page);

  const blockMenu = page.locator("[data-vizel-block-menu]");
  await expect(blockMenu).toBeVisible({ timeout: 2000 });

  // Open Turn into submenu
  const turnIntoTrigger = blockMenu.locator(".vizel-block-menu-submenu-trigger");
  await turnIntoTrigger.hover();

  const submenu = blockMenu.locator(".vizel-block-menu-submenu");
  await expect(submenu).toBeVisible({ timeout: 2000 });

  // Click "Heading 1"
  await submenu.locator(".vizel-block-menu-item-label", { hasText: "Heading 1" }).click();

  // Menu should close
  await expect(blockMenu).not.toBeVisible();

  // Paragraph should be converted to heading
  const editor = component.locator(".vizel-editor");
  await expect(editor.locator("h1", { hasText: "Test paragraph" })).toBeVisible();
}
