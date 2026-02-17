import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for list item keyboard navigation and reordering.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Verify Tab indents a bullet list item (sinks it) */
export async function testBulletListTabIndent(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a bullet list with two items
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  // Cursor is in the second item, press Tab to indent
  await page.keyboard.press("Tab");

  // The second item should now be nested inside the first item
  // This creates a nested list: <ul><li>First item<ul><li>Second item</li></ul></li></ul>
  const nestedList = editor.locator("ul ul");
  await expect(nestedList).toBeVisible();
  await expect(nestedList.locator("li")).toContainText("Second item");
}

/** Verify Shift+Tab outdents a bullet list item (lifts it) */
export async function testBulletListShiftTabOutdent(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a bullet list with two items
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  // Indent the second item first
  await page.keyboard.press("Tab");

  // Verify it's nested
  const nestedList = editor.locator("ul ul");
  await expect(nestedList).toBeVisible();

  // Now outdent it
  await page.keyboard.press("Shift+Tab");

  // The second item should be back at the top level
  const topLevelItems = editor.locator(":scope > ul > li");
  await expect(topLevelItems).toHaveCount(2);
  await expect(topLevelItems.nth(1)).toContainText("Second item");
}

/** Verify Tab indents a task list item (sinks it) */
export async function testTaskListTabIndent(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a task list with two items using slash command
  await page.keyboard.type("/task");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task one");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task two");

  // Cursor is in the second task, press Tab to indent
  await page.keyboard.press("Tab");

  // The second task should now be nested inside the first
  const nestedTaskList = editor.locator("ul[data-type='taskList'] ul[data-type='taskList']");
  await expect(nestedTaskList).toBeVisible();
  await expect(nestedTaskList.locator("li")).toContainText("Task two");
}

/** Verify Shift+Tab outdents a task list item (lifts it) */
export async function testTaskListShiftTabOutdent(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a task list with two items using slash command
  await page.keyboard.type("/task");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task one");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task two");

  // Indent the second task
  await page.keyboard.press("Tab");

  // Verify it's nested
  const nestedTaskList = editor.locator("ul[data-type='taskList'] ul[data-type='taskList']");
  await expect(nestedTaskList).toBeVisible();

  // Now outdent it
  await page.keyboard.press("Shift+Tab");

  // The second task should be back at the top level
  const topLevelTasks = editor.locator(":scope > ul[data-type='taskList'] > li");
  await expect(topLevelTasks).toHaveCount(2);
  await expect(topLevelTasks.nth(1)).toContainText("Task two");
}

/** Verify Alt+Up/Down reorders bullet list items */
export async function testBulletListAltArrowReorder(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a bullet list with three items
  await page.keyboard.type("- Apple");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Banana");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Cherry");

  // Cursor is in "Cherry" (third item), move it up
  await page.keyboard.press("Alt+ArrowUp");

  // Now order should be: Apple, Cherry, Banana
  const listItems = editor.locator("ul li");
  await expect(listItems.nth(0)).toContainText("Apple");
  await expect(listItems.nth(1)).toContainText("Cherry");
  await expect(listItems.nth(2)).toContainText("Banana");

  // Move Cherry up again to first position
  await page.keyboard.press("Alt+ArrowUp");

  // Now order should be: Cherry, Apple, Banana
  await expect(listItems.nth(0)).toContainText("Cherry");
  await expect(listItems.nth(1)).toContainText("Apple");
  await expect(listItems.nth(2)).toContainText("Banana");
}

/** Verify ordered list items can be reordered with Alt+Up/Down */
export async function testOrderedListAltArrowReorder(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create an ordered list with two items
  await page.keyboard.type("1. First");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second");

  // Cursor is in "Second", move it up
  await page.keyboard.press("Alt+ArrowUp");

  // Now "Second" should be first
  const listItems = editor.locator("ol li");
  await expect(listItems.first()).toContainText("Second");
  await expect(listItems.nth(1)).toContainText("First");
}
