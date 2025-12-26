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

/** Verify underline button toggles underline formatting */
export async function testBubbleMenuUnderlineToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const underlineButton = bubbleMenu.locator('[data-action="underline"]');

  await underlineButton.click();

  const editor = component.locator(".vizel-editor");
  const underline = editor.locator("u");
  await expect(underline).toContainText("Select this text");
}

/** Verify underline keyboard shortcut (Cmd+U) works */
export async function testBubbleMenuUnderlineShortcut(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type text with underline using keyboard shortcut
  await page.keyboard.press("ControlOrMeta+u");
  await page.keyboard.type("Underlined");
  await page.keyboard.press("ControlOrMeta+u");

  const underline = editor.locator("u");
  await expect(underline).toContainText("Underlined");
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

/** Verify text color picker dropdown opens and applies color */
export async function testBubbleMenuTextColorToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const textColorButton = bubbleMenu.locator('[data-action="textColor"]');

  await textColorButton.click();

  // Dropdown should be visible (rendered inside the color picker container)
  const dropdown = bubbleMenu.locator(".vizel-color-picker-dropdown");
  await expect(dropdown).toBeVisible();

  // Click a color swatch (red)
  const redSwatch = dropdown.locator('[data-color="#ef4444"]');
  await redSwatch.click();

  // Verify color is applied
  const editor = component.locator(".vizel-editor");
  const coloredText = editor.locator('span[style*="color"]');
  await expect(coloredText).toContainText("Select this text");
}

/** Verify highlight color picker dropdown opens and applies highlight */
export async function testBubbleMenuHighlightToggle(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const highlightButton = bubbleMenu.locator('[data-action="highlight"]');

  await highlightButton.click();

  // Dropdown should be visible
  const dropdown = bubbleMenu.locator(".vizel-color-picker-dropdown");
  await expect(dropdown).toBeVisible();

  // Click a highlight swatch (yellow)
  const yellowSwatch = dropdown.locator('[data-color="#fef08a"]');
  await yellowSwatch.click();

  // Verify highlight is applied
  const editor = component.locator(".vizel-editor");
  const highlightedText = editor.locator("mark");
  await expect(highlightedText).toContainText("Select this text");
}

/** Verify text color can be reset to default */
export async function testBubbleMenuTextColorReset(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const textColorButton = bubbleMenu.locator('[data-action="textColor"]');

  // First apply a color
  await textColorButton.click();
  const dropdown = bubbleMenu.locator(".vizel-color-picker-dropdown");
  const redSwatch = dropdown.locator('[data-color="#ef4444"]');
  await redSwatch.click();

  // Verify color is applied
  const editor = component.locator(".vizel-editor");
  let coloredText = editor.locator('span[style*="color"]');
  await expect(coloredText).toContainText("Select this text");

  // Re-select the text
  await page.keyboard.press("ControlOrMeta+a");
  await expect(bubbleMenu).toBeVisible();

  // Reset the color
  await textColorButton.click();
  const defaultSwatch = dropdown.locator('[data-color="inherit"]');
  await defaultSwatch.click();

  // Verify color is removed
  coloredText = editor.locator('span[style*="color"]');
  await expect(coloredText).toHaveCount(0);
}

/** Verify highlight can be removed */
export async function testBubbleMenuHighlightReset(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const highlightButton = bubbleMenu.locator('[data-action="highlight"]');

  // First apply a highlight
  await highlightButton.click();
  const dropdown = bubbleMenu.locator(".vizel-color-picker-dropdown");
  const yellowSwatch = dropdown.locator('[data-color="#fef08a"]');
  await yellowSwatch.click();

  // Verify highlight is applied
  const editor = component.locator(".vizel-editor");
  let highlightedText = editor.locator("mark");
  await expect(highlightedText).toContainText("Select this text");

  // Re-select the text
  await page.keyboard.press("ControlOrMeta+a");
  await expect(bubbleMenu).toBeVisible();

  // Remove the highlight
  await highlightButton.click();
  const transparentSwatch = dropdown.locator('[data-color="transparent"]');
  await transparentSwatch.click();

  // Verify highlight is removed
  highlightedText = editor.locator("mark");
  await expect(highlightedText).toHaveCount(0);
}
