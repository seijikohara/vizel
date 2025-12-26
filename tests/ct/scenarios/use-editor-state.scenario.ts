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
