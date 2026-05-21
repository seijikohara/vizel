import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that the outline renders one entry per heading in the document.
 */
export async function testOutlineRendersHeadings(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor [contenteditable]");
  const outline = component.locator("[data-vizel-outline]");

  // Outline `<nav>` mounts as empty; check the structural attribute
  // before any content is typed. `toBeVisible` is deferred until the
  // outline actually has children — an empty `<nav>` collapses to
  // zero height which Playwright reports as "hidden".
  await expect(outline).toHaveAttribute("role", "tree");

  // Type the three headings.
  await editor.click();
  await page.keyboard.type("# A");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## B");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## C");

  // Three outline entries become visible.
  await expect(outline).toBeVisible();
  const items = outline.getByRole("treeitem");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("A");
  await expect(items.nth(1)).toContainText("B");
  await expect(items.nth(2)).toContainText("C");
}

/**
 * Test that clicking an outline entry moves the editor selection to that heading.
 */
export async function testOutlineClickMovesSelection(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor [contenteditable]");
  const outline = component.locator("[data-vizel-outline]");
  const cursorPos = component.locator("[data-testid='cursor-pos']");

  await editor.click();
  await page.keyboard.type("# A");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## B");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## C");

  // Move the cursor back to the start.
  await page.keyboard.press("ControlOrMeta+Home");

  const initial = await cursorPos.textContent();

  // Click the "C" entry.
  await outline.getByRole("treeitem").nth(2).locator("button").click();

  // Selection moved past the initial position.
  await expect(cursorPos).not.toHaveText(initial ?? "");
}
