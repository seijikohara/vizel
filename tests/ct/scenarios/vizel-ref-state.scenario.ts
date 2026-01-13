import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Scenario: Test that Vizel + ref pattern correctly updates editor state
 *
 * This tests the pattern commonly used in demo apps where:
 * - Vizel component is used with a ref to access the editor
 * - useVizelState is used to trigger re-renders on editor changes
 * - getVizelEditorState is used to get character/word counts
 *
 * The key issue being tested: Using useRef to store the editor reference
 * does NOT trigger re-renders when the editor is created, causing
 * character/word counts to always show 0.
 *
 * The correct pattern uses useState to store the editor, which triggers
 * a re-render when the editor is set in onCreate callback.
 */

/**
 * Test that character count updates after typing
 * This should detect the useRef bug where counts remain 0
 */
export async function testVizelRefStateCharacterCount(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const charCountElement = component.locator("[data-testid='character-count']");
  const wordCountElement = component.locator("[data-testid='word-count']");

  // Wait for editor to be ready
  await expect(editor).toBeVisible();

  // Click and type some text
  await editor.click();
  await page.keyboard.type("Hello World");

  // Character and word counts should update
  // With the useRef bug, these would remain 0
  await expect(charCountElement).toHaveText("11", { timeout: 2000 });
  await expect(wordCountElement).toHaveText("2", { timeout: 2000 });
}

/**
 * Test that initial content shows correct counts
 */
export async function testVizelRefStateInitialContent(
  component: Locator,
  _page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const charCountElement = component.locator("[data-testid='character-count']");
  const wordCountElement = component.locator("[data-testid='word-count']");

  // Wait for editor to be ready
  await expect(editor).toBeVisible();

  // Initial content "Test content" should be reflected
  // With the useRef bug, counts would be 0
  await expect(charCountElement).toHaveText("12", { timeout: 2000 });
  await expect(wordCountElement).toHaveText("2", { timeout: 2000 });
}

/**
 * Test that counts update when adding more text to initial content
 */
export async function testVizelRefStateUpdatesOnChange(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const charCountElement = component.locator("[data-testid='character-count']");

  await expect(editor).toBeVisible();

  // Initial content is "Test content" (12 chars)
  await expect(charCountElement).toHaveText("12", { timeout: 2000 });

  // Add more text
  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.type(" more");

  // Should now be 17 characters
  await expect(charCountElement).toHaveText("17", { timeout: 2000 });
}
