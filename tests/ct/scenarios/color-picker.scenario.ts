import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that ColorPicker renders the color palette grid
 */
export async function testRendersColorPalette(_component: Locator, page: Page): Promise<void> {
  const content = page.locator(".vizel-color-picker-content");
  await expect(content).toBeVisible();
  await expect(content).toHaveAttribute("role", "listbox");

  const grid = page.locator(".vizel-color-picker-grid");
  await expect(grid).toBeVisible();

  const swatches = page.locator(".vizel-color-picker-swatch");
  const count = await swatches.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * Test that ColorPicker shows current selection with active state
 */
export async function testShowsCurrentSelection(
  _component: Locator,
  page: Page,
  expectedColor: string
): Promise<void> {
  const activeSwatch = page.locator(`.vizel-color-picker-swatch[data-color="${expectedColor}"]`);
  await expect(activeSwatch).toHaveClass(/is-active/);
  await expect(activeSwatch).toHaveAttribute("aria-selected", "true");
}

/**
 * Test that ColorPicker calls onChange when color is selected
 */
export async function testOnChangeCalledOnSelection(
  _component: Locator,
  page: Page
): Promise<void> {
  // Click on a color swatch (skip first row which may contain "none" value)
  const targetSwatch = page.locator(".vizel-color-picker-swatch").nth(4);
  await targetSwatch.click();

  // The fixture should update the selected color display
  const selectedDisplay = page.locator("[data-testid='selected-color']");
  await expect(selectedDisplay).not.toBeEmpty();
}

/**
 * Test keyboard navigation - ArrowRight moves to next swatch
 */
export async function testKeyboardNavigationArrowRight(
  _component: Locator,
  page: Page
): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const firstSwatch = swatches.first();
  const secondSwatch = swatches.nth(1);

  await firstSwatch.focus();
  await expect(firstSwatch).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(secondSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - ArrowLeft moves to previous swatch
 */
export async function testKeyboardNavigationArrowLeft(
  _component: Locator,
  page: Page
): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const secondSwatch = swatches.nth(1);
  const firstSwatch = swatches.first();

  await secondSwatch.focus();
  await expect(secondSwatch).toBeFocused();

  await page.keyboard.press("ArrowLeft");
  await expect(firstSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - ArrowDown moves down one row (4 items)
 */
export async function testKeyboardNavigationArrowDown(
  _component: Locator,
  page: Page
): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const firstSwatch = swatches.first();
  const fifthSwatch = swatches.nth(4);

  await firstSwatch.focus();
  await expect(firstSwatch).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(fifthSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - ArrowUp moves up one row (4 items)
 */
export async function testKeyboardNavigationArrowUp(
  _component: Locator,
  page: Page
): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const fifthSwatch = swatches.nth(4);
  const firstSwatch = swatches.first();

  await fifthSwatch.focus();
  await expect(fifthSwatch).toBeFocused();

  await page.keyboard.press("ArrowUp");
  await expect(firstSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - Home moves to first swatch
 */
export async function testKeyboardNavigationHome(_component: Locator, page: Page): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const tenthSwatch = swatches.nth(10);
  const firstSwatch = swatches.first();

  await tenthSwatch.focus();
  await expect(tenthSwatch).toBeFocused();

  await page.keyboard.press("Home");
  await expect(firstSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - End moves to last swatch
 */
export async function testKeyboardNavigationEnd(_component: Locator, page: Page): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const firstSwatch = swatches.first();
  const lastSwatch = swatches.last();

  await firstSwatch.focus();
  await expect(firstSwatch).toBeFocused();

  await page.keyboard.press("End");
  await expect(lastSwatch).toBeFocused();
}

/**
 * Test keyboard navigation - Enter/Space selects current swatch
 */
export async function testKeyboardNavigationEnterSelect(
  _component: Locator,
  page: Page
): Promise<void> {
  const swatches = page.locator(".vizel-color-picker-swatch");
  const targetSwatch = swatches.nth(5);

  await targetSwatch.focus();
  await page.keyboard.press("Enter");

  // The fixture should update the selected color display
  const selectedDisplay = page.locator("[data-testid='selected-color']");
  await expect(selectedDisplay).not.toBeEmpty();
}

/**
 * Helper to set input value for React controlled input
 * Uses keyboard typing which properly triggers React's onChange
 */
async function setInputValue(page: Page, input: Locator, value: string): Promise<void> {
  // Click to focus and select all existing text
  await input.click({ clickCount: 3 });
  // Type new value character by character
  await page.keyboard.type(value);
}

/**
 * Test custom color input works
 */
export async function testCustomColorInput(_component: Locator, page: Page): Promise<void> {
  const input = page.locator(".vizel-color-picker-input");
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute("placeholder", "#000000");

  // Use helper to set value (includes focusing)
  await setInputValue(page, input, "#ff5500");

  // Wait for state to update
  await expect(input).toHaveValue("#ff5500");

  // Apply button should be enabled
  const applyButton = page.locator(".vizel-color-picker-apply");
  await expect(applyButton).toBeEnabled();

  // Click apply
  await applyButton.click();

  // The fixture should update the selected color display
  const selectedDisplay = page.locator("[data-testid='selected-color']");
  await expect(selectedDisplay).toHaveText(/#[fF][fF]5500/);
}

/**
 * Test custom color input validates hex colors
 */
export async function testCustomColorInputValidation(
  _component: Locator,
  page: Page
): Promise<void> {
  const input = page.locator(".vizel-color-picker-input");
  const applyButton = page.locator(".vizel-color-picker-apply");

  // Fill with an invalid color (use only 7 chars due to maxLength)
  await setInputValue(page, input, "notacol");
  await expect(input).toHaveValue("notacol");
  await expect(applyButton).toBeDisabled();

  // Fill with a valid short hex
  await setInputValue(page, input, "#f00");
  await expect(input).toHaveValue("#f00");
  await expect(applyButton).toBeEnabled();

  // Fill with a valid long hex
  await setInputValue(page, input, "#ff0000");
  await expect(input).toHaveValue("#ff0000");
  await expect(applyButton).toBeEnabled();
}

/**
 * Test recent colors section displays
 */
export async function testRecentColorsDisplay(_component: Locator, page: Page): Promise<void> {
  const _recentSection = page.locator(".vizel-color-picker-section").first();
  const recentLabel = page.locator(".vizel-color-picker-label");

  await expect(recentLabel).toHaveText("Recent");

  const recentGrid = page.locator(".vizel-color-picker-recent");
  await expect(recentGrid).toBeVisible();

  const recentSwatches = recentGrid.locator(".vizel-color-picker-swatch");
  const count = await recentSwatches.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * Test ARIA attributes for accessibility
 */
export async function testAccessibilityAttributes(
  _component: Locator,
  page: Page,
  label: string
): Promise<void> {
  const content = page.locator(".vizel-color-picker-content");
  await expect(content).toHaveAttribute("role", "listbox");
  await expect(content).toHaveAttribute("aria-label", label);

  const swatches = page.locator(".vizel-color-picker-swatch");
  const firstSwatch = swatches.first();
  await expect(firstSwatch).toHaveAttribute("role", "option");
}

/**
 * Test none value displays correctly (transparent/inherit)
 */
export async function testNoneValueDisplay(_component: Locator, page: Page): Promise<void> {
  // First swatch in HIGHLIGHT_COLORS is "None" with transparent
  const noneSwatch = page.locator('.vizel-color-picker-swatch[data-color="transparent"]');
  await expect(noneSwatch).toBeVisible();

  // None indicator should contain an icon (SVG)
  const noneIndicator = noneSwatch.locator(".vizel-color-picker-none");
  await expect(noneIndicator).toBeVisible();
  await expect(noneIndicator.locator("svg")).toBeVisible();
}
