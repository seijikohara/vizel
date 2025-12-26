import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for SlashMenu functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 *
 * Note: SlashMenu is rendered as a popup appended to document.body,
 * so we use page.locator() instead of component.locator() for the menu.
 */

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";

/** Verify slash menu appears when typing "/" */
export async function testSlashMenuAppears(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/");

  // SlashMenu is rendered in document.body, not inside the component
  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();
}

/** Verify slash menu hides when pressing Escape */
export async function testSlashMenuEscape(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Escape closes the menu via Backspace to delete the "/" character
  await page.keyboard.press("Backspace");
  await expect(slashMenu).not.toBeVisible();
}

/** Verify slash menu filters items when typing */
export async function testSlashMenuFiltering(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/head");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Should show heading items - look for menu items containing "Heading"
  const headingItem = slashMenu.locator(".vizel-slash-menu-item", {
    hasText: "Heading",
  });
  await expect(headingItem.first()).toBeVisible();
}

/** Verify selecting heading from slash menu */
export async function testSlashMenuHeading(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type "/" to open slash menu
  await page.keyboard.type("/");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Find and click "Heading 1" item directly
  const headingItem = slashMenu.locator(".vizel-slash-menu-item", {
    hasText: "Heading 1",
  });
  await headingItem.click();

  // Wait for menu to close and heading to be inserted
  await expect(slashMenu).not.toBeVisible();

  // Ensure editor has focus and wait for the heading to exist
  const heading = editor.locator("h1");
  await expect(heading).toBeVisible();

  // Click editor to ensure focus, then type heading content
  await editor.click();
  await page.keyboard.type("My Heading");

  await expect(heading).toContainText("My Heading");
}

/** Verify selecting bullet list from slash menu */
export async function testSlashMenuBulletList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/bullet");
  await page.keyboard.press("Enter");

  // Type list content
  await page.keyboard.type("List item");

  const list = editor.locator("ul");
  await expect(list).toBeVisible();
}

/** Verify selecting ordered list from slash menu */
export async function testSlashMenuOrderedList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/numbered");
  await page.keyboard.press("Enter");

  // Type list content
  await page.keyboard.type("List item");

  const list = editor.locator("ol");
  await expect(list).toBeVisible();
}

/** Verify selecting task list from slash menu */
export async function testSlashMenuTaskList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/task");
  await page.keyboard.press("Enter");

  // Wait for task list to be created (use class selector)
  const taskList = editor.locator(".vizel-task-list");
  await expect(taskList).toBeVisible({ timeout: 3000 });

  // Type task content
  await page.keyboard.type("My task");

  // Checkbox is nested inside task item
  const taskItem = editor.locator(".vizel-task-item");
  const checkbox = taskItem.locator("input[type='checkbox']");
  await expect(checkbox).toBeVisible();
}

/** Verify selecting code block from slash menu */
export async function testSlashMenuCodeBlock(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/code");
  await page.keyboard.press("Enter");

  // Type code content
  await page.keyboard.type("const x = 1;");

  const codeBlock = editor.locator("pre");
  await expect(codeBlock).toBeVisible();
}

/** Verify selecting blockquote from slash menu */
export async function testSlashMenuBlockquote(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/quote");
  await page.keyboard.press("Enter");

  // Type quote content
  await page.keyboard.type("A wise quote");

  const quote = editor.locator("blockquote");
  await expect(quote).toBeVisible();
}

/** Verify keyboard navigation in slash menu */
export async function testSlashMenuKeyboardNavigation(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Navigate down
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");

  // Check that an item is selected (has data-selected attribute)
  const selectedItem = slashMenu.locator("[data-selected='true']");
  await expect(selectedItem).toBeVisible();
}

/** Verify empty state when no items match filter */
export async function testSlashMenuEmptyState(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/xyznonexistent");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  const emptyState = slashMenu.locator("[data-vizel-slash-menu-empty]");
  await expect(emptyState).toBeVisible();
}
