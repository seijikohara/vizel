import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that useEditorState updates when editor state changes
 */
export async function testEditorStateUpdatesOnChange(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const updateCounter = component.locator("[data-testid='update-count']");

  // Get initial count
  await expect(updateCounter).toBeVisible();
  const initialCount = await updateCounter.textContent();

  // Type text to trigger state change
  await editor.click();
  await page.keyboard.type("Hello");

  // Count should have increased
  await expect(updateCounter).not.toHaveText(initialCount ?? "0");
}

/**
 * Test that useEditorState tracks bold formatting state
 */
export async function testEditorStateTracksBoldActive(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const boldIndicator = component.locator("[data-testid='bold-active']");

  await editor.click();
  await page.keyboard.type("Test text");

  // Select all text
  await page.keyboard.press("ControlOrMeta+a");

  // Initially not bold
  await expect(boldIndicator).toHaveText("false");

  // Apply bold
  await page.keyboard.press("ControlOrMeta+b");

  // Should now show bold as active
  await expect(boldIndicator).toHaveText("true");

  // Toggle off
  await page.keyboard.press("ControlOrMeta+b");
  await expect(boldIndicator).toHaveText("false");
}

/**
 * Test that useEditorState tracks italic formatting state
 */
export async function testEditorStateTracksItalicActive(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const italicIndicator = component.locator("[data-testid='italic-active']");

  await editor.click();
  await page.keyboard.type("Test text");
  await page.keyboard.press("ControlOrMeta+a");

  await expect(italicIndicator).toHaveText("false");
  await page.keyboard.press("ControlOrMeta+i");
  await expect(italicIndicator).toHaveText("true");
}

/**
 * Test that useEditorState works with null editor
 */
export async function testEditorStateWithNullEditor(
  component: Locator,
  _page: Page
): Promise<void> {
  const updateCounter = component.locator("[data-testid='update-count']");

  // Should render with count 0 when editor is null
  await expect(updateCounter).toHaveText("0");
}

/**
 * Test that getEditorState returns character count
 */
export async function testEditorStateCharacterCount(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const charCountElement = component.locator("[data-testid='character-count']");
  const wordCountElement = component.locator("[data-testid='word-count']");

  // Initially empty
  await expect(charCountElement).toHaveText("0");
  await expect(wordCountElement).toHaveText("0");

  // Type some text
  await editor.click();
  await page.keyboard.type("Hello World");

  // Should show correct counts (11 characters, 2 words)
  await expect(charCountElement).toHaveText("11");
  await expect(wordCountElement).toHaveText("2");

  // Add more text
  await page.keyboard.type(" Test");

  // Should update counts (16 characters, 3 words)
  await expect(charCountElement).toHaveText("16");
  await expect(wordCountElement).toHaveText("3");
}

/**
 * Test that getEditorState returns correct empty/focus state
 */
export async function testEditorStateEmptyAndFocus(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const isEmptyElement = component.locator("[data-testid='is-empty']");
  const isFocusedElement = component.locator("[data-testid='is-focused']");

  // Initially empty and not focused
  await expect(isEmptyElement).toHaveText("true");
  await expect(isFocusedElement).toHaveText("false");

  // Click to focus
  await editor.click();
  await expect(isFocusedElement).toHaveText("true");

  // Type text - no longer empty
  await page.keyboard.type("Hello");
  await expect(isEmptyElement).toHaveText("false");

  // Click outside to blur
  await component.click({ position: { x: 0, y: 0 } });
  await expect(isFocusedElement).toHaveText("false");
}
