import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for drag handle functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Verify the drag handle is rendered when hovering over a block */
export async function testDragHandleVisibleOnHover(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type some content to create a block
  await page.keyboard.type("First paragraph");

  // The drag handle element should exist
  const dragHandle = page.locator(".vizel-drag-handle");

  // Hover over the paragraph
  const paragraph = editor.locator("p").first();
  await paragraph.hover();

  // Drag handle should become visible
  await expect(dragHandle).toBeVisible({ timeout: 2000 });
}

/** Verify block can be moved up with Alt+ArrowUp */
export async function testMoveBlockUpWithKeyboard(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create two paragraphs
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");

  // Cursor is in the second paragraph
  // Move it up with Alt+ArrowUp
  await page.keyboard.press("Alt+ArrowUp");

  // Now "Second paragraph" should be first
  const paragraphs = editor.locator("p");
  await expect(paragraphs.first()).toContainText("Second paragraph");
  await expect(paragraphs.nth(1)).toContainText("First paragraph");
}

/** Verify block can be moved down with Alt+ArrowDown */
export async function testMoveBlockDownWithKeyboard(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create two paragraphs
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");

  // Move cursor up to first paragraph (ArrowUp goes to previous line)
  await page.keyboard.press("ArrowUp");
  // Brief pause for cursor position update (required for Vue/Svelte reactivity)
  await page.waitForTimeout(50);

  // Move the first paragraph down with Alt+ArrowDown
  await page.keyboard.press("Alt+ArrowDown");

  // Now "Second paragraph" should be first
  const paragraphs = editor.locator("p");
  await expect(paragraphs.first()).toContainText("Second paragraph");
  await expect(paragraphs.nth(1)).toContainText("First paragraph");
}

/** Verify heading block can be moved with keyboard */
export async function testMoveHeadingWithKeyboard(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a heading and a paragraph
  await page.keyboard.type("# Heading");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraph content");

  // Cursor is in the paragraph
  // Move it up with Alt+ArrowUp
  await page.keyboard.press("Alt+ArrowUp");

  // Now paragraph should be first, heading second
  const firstElement = editor.locator("> *").first();
  await expect(firstElement).toContainText("Paragraph content");

  const heading = editor.locator("h1");
  await expect(heading).toContainText("Heading");
}

/** Verify drag handle has correct accessibility attributes */
export async function testDragHandleAccessibility(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type some content to create a block
  await page.keyboard.type("Test paragraph");

  // Hover to show drag handle
  const paragraph = editor.locator("p").first();
  await paragraph.hover();

  const dragHandle = page.locator(".vizel-drag-handle");
  await expect(dragHandle).toBeVisible({ timeout: 2000 });

  // Check accessibility attributes
  await expect(dragHandle).toHaveAttribute("role", "button");
  await expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder block");
  await expect(dragHandle).toHaveAttribute("draggable", "true");
}

/** Verify drag handle is clickable and interactive */
export async function testDragHandleIsClickable(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type some content
  await page.keyboard.type("Test paragraph");

  // Hover to show drag handle
  const paragraph = editor.locator("p").first();
  await paragraph.hover();

  const dragHandle = page.locator(".vizel-drag-handle");
  await expect(dragHandle).toBeVisible({ timeout: 2000 });

  // Verify the handle can be clicked without errors
  await dragHandle.click();

  // The handle should still be visible after click
  await expect(dragHandle).toBeVisible();
}

/** Verify list item can be moved up with Alt+ArrowUp */
export async function testMoveListItemUpWithKeyboard(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a bullet list with two items
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  // Cursor is in the second item, move it up
  await page.keyboard.press("Alt+ArrowUp");

  // Now "Second item" should be first in the list
  const listItems = editor.locator("ul li");
  await expect(listItems.first()).toContainText("Second item");
  await expect(listItems.nth(1)).toContainText("First item");
}

/** Verify list item can be moved down with Alt+ArrowDown */
export async function testMoveListItemDownWithKeyboard(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a bullet list with two items
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  // Move cursor up to first list item (ArrowUp goes to previous line)
  await page.keyboard.press("ArrowUp");
  // Brief pause for cursor position update (required for Vue/Svelte reactivity)
  await page.waitForTimeout(50);

  // Move the first item down
  await page.keyboard.press("Alt+ArrowDown");

  // Now "Second item" should be first
  const listItems = editor.locator("ul li");
  await expect(listItems.first()).toContainText("Second item");
  await expect(listItems.nth(1)).toContainText("First item");
}

/** Verify task list item can be moved with keyboard */
export async function testMoveTaskItemWithKeyboard(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create a task list with two items using slash command
  await page.keyboard.type("/task");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task one");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Task two");

  // Cursor is in the second task, move it up
  await page.keyboard.press("Alt+ArrowUp");

  // Now "Task two" should be first
  const taskItems = editor.locator("ul[data-type='taskList'] li");
  await expect(taskItems.first()).toContainText("Task two");
  await expect(taskItems.nth(1)).toContainText("Task one");
}

/** Verify drag handle appears on hover and hides when not hovering */
export async function testDragHandleHoverBehavior(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type some content
  await page.keyboard.type("Test paragraph");

  const dragHandle = page.locator(".vizel-drag-handle");

  // Initially, drag handle should have opacity 0 or be hidden
  // Move away from the editor to ensure no hover
  await page.mouse.move(0, 0);

  // Wait for opacity to decrease (CSS transition)
  await expect(dragHandle).toHaveCSS("opacity", /^0(\.\d+)?$/);

  // Now hover over the paragraph
  const paragraph = editor.locator("p").first();
  await paragraph.hover();

  // Drag handle should become visible
  await expect(dragHandle).toBeVisible({ timeout: 2000 });

  // Wait for opacity transition to complete using explicit assertion
  await expect(async () => {
    const opacity = await dragHandle.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number.parseFloat(opacity)).toBeGreaterThan(0.9);
  }).toPass({ timeout: 1000 });
}
