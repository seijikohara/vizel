import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for the Vizel all-in-one component.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Verify the Vizel component renders with editor and bubble menu */
export async function testVizelRenders(_component: Locator, page: Page): Promise<void> {
  // Vizel root should be present - use page.locator since component IS the root
  const root = page.locator("[data-vizel-root]");
  await expect(root).toBeVisible();

  // Editor should be rendered
  const editor = root.locator(".vizel-editor");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("contenteditable", "true");

  // Bubble menu should be present (hidden by default) - use page.locator for portal
  const bubbleMenu = page.locator("[data-vizel-bubble-menu]");
  await expect(bubbleMenu).toBeAttached();
}

/** Verify the Vizel component works with placeholder */
export async function testVizelPlaceholder(
  _component: Locator,
  page: Page,
  expectedPlaceholder: string
): Promise<void> {
  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await expect(editor.locator("[data-placeholder]")).toHaveAttribute(
    "data-placeholder",
    expectedPlaceholder
  );
}

/** Verify typing in the Vizel component */
export async function testVizelTyping(_component: Locator, page: Page): Promise<void> {
  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await editor.click();
  await page.keyboard.type("Hello from Vizel!");
  await expect(editor).toContainText("Hello from Vizel!");
}

/** Verify bubble menu appears on text selection */
export async function testVizelBubbleMenuOnSelection(
  _component: Locator,
  page: Page
): Promise<void> {
  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await editor.click();
  await page.keyboard.type("Select this text");

  // Select all text
  await page.keyboard.press("ControlOrMeta+a");

  // Wait for bubble menu to become visible - use page.locator for portal
  const bubbleMenu = page.locator("[data-vizel-bubble-menu]");
  await expect(bubbleMenu).toBeVisible({ timeout: 3000 });
}

/** Verify Vizel without bubble menu when showBubbleMenu is false */
export async function testVizelWithoutBubbleMenu(_component: Locator, page: Page): Promise<void> {
  // Editor should be rendered
  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await expect(editor).toBeVisible();

  // Bubble menu should NOT be present - use page.locator for portal
  const bubbleMenu = page.locator("[data-vizel-bubble-menu]");
  await expect(bubbleMenu).not.toBeAttached();
}

/** Verify slash menu works in Vizel component */
export async function testVizelSlashMenu(_component: Locator, page: Page): Promise<void> {
  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await editor.click();
  await page.keyboard.type("/");

  // Slash menu should appear - use page.locator for portal
  const slashMenu = page.locator("[data-vizel-slash-menu]");
  await expect(slashMenu).toBeVisible({ timeout: 3000 });
}

/** Verify formatting via bubble menu in Vizel component */
export async function testVizelBubbleMenuFormatting(
  _component: Locator,
  page: Page
): Promise<void> {
  // Wait for bubble menu element to be attached (may be hidden initially)
  const bubbleMenu = page.locator("[data-vizel-bubble-menu]");
  await expect(bubbleMenu).toBeAttached({ timeout: 5000 });

  const editor = page.locator("[data-vizel-root] .vizel-editor");
  await editor.click();
  await page.keyboard.type("Format this");

  // Select all text
  await page.keyboard.press("ControlOrMeta+a");

  // Wait a moment for selection to register
  await page.waitForTimeout(100);

  // Wait for bubble menu to become visible
  await expect(bubbleMenu).toBeVisible({ timeout: 5000 });

  // Click bold button - use data-action attribute
  const boldButton = bubbleMenu.locator('[data-action="bold"]');
  await boldButton.click();

  // Verify text is bold
  const bold = editor.locator("strong");
  await expect(bold).toContainText("Format this");
}
