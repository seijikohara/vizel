import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for HorizontalRule functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";

/**
 * Test that horizontal rule can be inserted via slash command
 */
export async function testHorizontalRuleViaSlashCommand(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/divider");
  await page.keyboard.press("Enter");

  // Wait for slash menu to close
  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).not.toBeVisible();

  // Horizontal rule should be inserted
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
}

/**
 * Test that horizontal rule can be inserted via "---" input rule
 */
export async function testHorizontalRuleViaHyphens(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("---");

  // Horizontal rule should be inserted
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
}

/**
 * Test that horizontal rule can be inserted via "*** " input rule
 * Note: Tiptap requires a space after *** to avoid conflicts with bold/italic syntax
 */
export async function testHorizontalRuleViaAsterisks(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("*** ");

  // Horizontal rule should be inserted
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
}

/**
 * Test that horizontal rule can be inserted via "___ " input rule
 * Note: Tiptap requires a space after ___ to avoid conflicts with bold/italic syntax
 */
export async function testHorizontalRuleViaUnderscores(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("___ ");

  // Horizontal rule should be inserted
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
}

/**
 * Test that horizontal rule can be selected (node selection)
 */
export async function testHorizontalRuleSelection(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("---");

  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();

  // Click on the horizontal rule to select it
  await hr.click();

  // Should have the ProseMirror selected node class
  await expect(hr).toHaveClass(/ProseMirror-selectednode/);
}

/**
 * Test that horizontal rule can be deleted with backspace
 */
export async function testHorizontalRuleDelete(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("---");

  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();

  // Click on the horizontal rule to select it
  await hr.click();
  await expect(hr).toHaveClass(/ProseMirror-selectednode/);

  // Delete it with backspace
  await page.keyboard.press("Backspace");

  // Should be deleted
  await expect(hr).not.toBeVisible();
}

/**
 * Test that the divider slash command appears in slash menu
 */
export async function testDividerInSlashMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/divider");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Should show "Divider" item
  const dividerItem = slashMenu.locator(".vizel-slash-menu-item", {
    hasText: "Divider",
  });
  await expect(dividerItem).toBeVisible();
}
