import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for BubbleMenu functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const BUBBLE_MENU_SELECTOR = "[data-vizel-bubble-menu]";

/** Helper to select text in the editor */
async function selectTextInEditor(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Select this text");
  await page.keyboard.press("ControlOrMeta+a");
}

/** Verify bubble menu appears when text is selected */
export async function testBubbleMenuAppears(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  await expect(bubbleMenu).toBeVisible();
}

/** Verify bubble menu hides when Escape key is pressed */
export async function testBubbleMenuHides(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  await expect(bubbleMenu).toBeVisible();

  // Hide bubble menu by pressing Escape to collapse selection
  await page.keyboard.press("Escape");
  await expect(bubbleMenu).not.toBeVisible();
}

/** Verify bold button toggles bold formatting */
export async function testBubbleMenuBoldToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const boldButton = bubbleMenu.locator('[data-action="bold"]');

  await boldButton.click();

  const editor = component.locator(".vizel-editor");
  const bold = editor.locator("strong");
  await expect(bold).toContainText("Select this text");
}

/** Verify italic button toggles italic formatting */
export async function testBubbleMenuItalicToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const italicButton = bubbleMenu.locator('[data-action="italic"]');

  await italicButton.click();

  const editor = component.locator(".vizel-editor");
  const italic = editor.locator("em");
  await expect(italic).toContainText("Select this text");
}

/** Verify strike button toggles strikethrough formatting */
export async function testBubbleMenuStrikeToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const strikeButton = bubbleMenu.locator('[data-action="strike"]');

  await strikeButton.click();

  const editor = component.locator(".vizel-editor");
  const strike = editor.locator("s");
  await expect(strike).toContainText("Select this text");
}

/** Verify code button toggles inline code formatting */
export async function testBubbleMenuCodeToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const codeButton = bubbleMenu.locator('[data-action="code"]');

  await codeButton.click();

  const editor = component.locator(".vizel-editor");
  const code = editor.locator("code");
  await expect(code).toContainText("Select this text");
}

/** Verify link editor opens when link button is clicked */
export async function testBubbleMenuLinkEditor(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');

  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  await expect(linkEditor).toBeVisible();
}

/** Verify active state is shown for formatted text */
export async function testBubbleMenuActiveState(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type bold text
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("Bold");
  await page.keyboard.press("ControlOrMeta+b");

  // Select the bold text
  await page.keyboard.press("ControlOrMeta+a");

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  await expect(bubbleMenu).toBeVisible();

  const boldButton = bubbleMenu.locator('[data-action="bold"]');
  // Check if button has is-active class (the data-active might not be set correctly)
  await expect(boldButton).toHaveClass(/is-active/);
}
