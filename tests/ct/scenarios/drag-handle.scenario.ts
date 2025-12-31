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

  // Click on the first paragraph to position cursor there
  const firstParagraph = editor.locator("p").first();
  await firstParagraph.click();

  // Move it down with Alt+ArrowDown
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
