import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { SaveStatus } from "@vizel/core";

/**
 * Shared test scenarios for SaveIndicator component
 */

/**
 * Test that SaveIndicator renders correctly with each status
 */
export async function testSaveIndicatorStatuses(
  mount: (status: SaveStatus) => Promise<Locator>,
  _page: Page
): Promise<void> {
  // Test 'saved' status
  let component = await mount("saved");
  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/vizel-save-indicator--saved/);
  await expect(component).toContainText("Saved");

  // Test 'saving' status
  component = await mount("saving");
  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/vizel-save-indicator--saving/);
  await expect(component).toContainText("Saving");

  // Test 'unsaved' status
  component = await mount("unsaved");
  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/vizel-save-indicator--unsaved/);
  await expect(component).toContainText("Unsaved");

  // Test 'error' status
  component = await mount("error");
  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/vizel-save-indicator--error/);
  await expect(component).toContainText("Error");
}

/**
 * Test that SaveIndicator shows icons for each status
 */
export async function testSaveIndicatorIcons(component: Locator, _page: Page): Promise<void> {
  const icon = component.locator(".vizel-save-indicator-icon");
  await expect(icon).toBeVisible();
}

/**
 * Test that SaveIndicator shows timestamp when provided
 */
export async function testSaveIndicatorTimestamp(component: Locator, _page: Page): Promise<void> {
  const timestamp = component.locator(".vizel-save-indicator-timestamp");
  await expect(timestamp).toBeVisible();
  // Should show relative time like "Just now" or "Xs ago"
  await expect(timestamp).toHaveText(/(Just now|ago)/);
}

/**
 * Test that SaveIndicator hides timestamp when showTimestamp is false
 */
export async function testSaveIndicatorHideTimestamp(
  component: Locator,
  _page: Page
): Promise<void> {
  const timestamp = component.locator(".vizel-save-indicator-timestamp");
  await expect(timestamp).not.toBeVisible();
}

/**
 * Test that SaveIndicator accepts custom className
 */
export async function testSaveIndicatorCustomClass(
  component: Locator,
  _page: Page,
  customClass: string
): Promise<void> {
  await expect(component).toHaveClass(new RegExp(customClass));
}
