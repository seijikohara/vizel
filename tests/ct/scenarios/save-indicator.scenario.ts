import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { VizelSaveStatus } from "@vizel/core";

/**
 * Shared test scenarios for SaveIndicator component
 */

/**
 * Test that SaveIndicator renders correctly with each status
 */
export async function testSaveIndicatorStatuses(
  mount: (status: VizelSaveStatus) => Promise<Locator>,
  _page: Page
): Promise<void> {
  const cases: ReadonlyArray<{
    status: VizelSaveStatus;
    classPattern: RegExp;
    text: string;
  }> = [
    { status: "saved", classPattern: /vizel-save-indicator--saved/, text: "Saved" },
    { status: "saving", classPattern: /vizel-save-indicator--saving/, text: "Saving" },
    { status: "unsaved", classPattern: /vizel-save-indicator--unsaved/, text: "Unsaved" },
    { status: "error", classPattern: /vizel-save-indicator--error/, text: "Error" },
  ];

  for (const { status, classPattern, text } of cases) {
    const component = await mount(status);
    await expect(component).toBeVisible();
    await expect(component).toHaveClass(classPattern);
    await expect(component).toContainText(text);
  }
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
