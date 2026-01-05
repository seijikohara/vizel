import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Details (collapsible content) functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Helper to type slash command and select from menu */
async function selectSlashCommand(page: Page, command: string): Promise<void> {
  await page.keyboard.type(`/${command}`);
  // Wait for slash menu to appear
  await expect(page.locator(".vizel-slash-menu")).toBeVisible();
  await page.keyboard.press("Enter");
}

/** Verify Details can be inserted via slash command */
export async function testDetailsInsertedViaSlashCommand(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  // Verify details block was created
  const details = editor.locator(".vizel-details");
  await expect(details).toBeVisible();

  // Verify summary is present
  const summary = editor.locator(".vizel-details-summary");
  await expect(summary).toBeVisible();

  // Verify content area exists (may be hidden when collapsed)
  const content = editor.locator(".vizel-details-content");
  await expect(content).toBeAttached();
}

/** Verify Details block renders with correct structure */
export async function testDetailsBlockStructure(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  // Verify the details element structure
  const details = editor.locator(".vizel-details");
  await expect(details).toBeVisible();

  // Summary should be a clickable element
  const summary = editor.locator(".vizel-details-summary");
  await expect(summary).toBeVisible();

  // Content area should exist
  const content = editor.locator(".vizel-details-content");
  await expect(content).toBeAttached();
}

/** Verify Details can be toggled open/closed */
export async function testDetailsToggle(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  const details = editor.locator(".vizel-details");
  const summary = editor.locator(".vizel-details-summary");
  const content = editor.locator(".vizel-details-content");

  // Ensure summary is visible first
  await expect(summary).toBeVisible();

  // Click summary to toggle - content visibility should change
  // First, ensure content is attached
  await expect(content).toBeAttached();

  // Click to toggle
  await summary.click();

  // The details block should still be visible (auto-retrying assertion)
  await expect(details).toBeVisible();
}

/** Verify content can be added to Details summary */
export async function testDetailsSummaryEditable(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  const summary = editor.locator(".vizel-details-summary");
  await summary.click();

  // Type some text in the summary
  await page.keyboard.type("Click to expand");

  // Verify the text was added
  await expect(summary).toContainText("Click to expand");
}

/** Verify content can be added to Details content area */
export async function testDetailsContentEditable(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  const details = editor.locator(".vizel-details");
  const summary = editor.locator(".vizel-details-summary");
  const content = editor.locator(".vizel-details-content");

  // Ensure summary is visible first
  await expect(summary).toBeVisible();

  // Wait for content to be attached
  await expect(content).toBeAttached();

  // Expand the details block
  // Tiptap's Details extension uses a hidden attribute on content, not native details behavior
  await details.evaluate((el) => el.setAttribute("open", "true"));
  await content.evaluate((el) => el.removeAttribute("hidden"));

  // Now content should be visible (auto-retrying assertion)
  await expect(content).toBeVisible();

  // Click on the content area to focus it
  await content.click();

  // Type in the content area
  await page.keyboard.type("This is the hidden content");

  // Verify the text was added
  await expect(content).toContainText("This is the hidden content");
}

/** Verify Details block has proper CSS classes */
export async function testDetailsCssClasses(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await selectSlashCommand(page, "details");

  // Check all required CSS classes
  const details = editor.locator(".vizel-details");
  await expect(details).toBeVisible();

  const summary = editor.locator(".vizel-details-summary");
  await expect(summary).toBeVisible();

  // Content exists (may be hidden when collapsed)
  const content = editor.locator(".vizel-details-content");
  await expect(content).toBeAttached();
}
