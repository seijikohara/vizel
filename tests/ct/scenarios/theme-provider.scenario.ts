import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for ThemeProvider component
 */

/**
 * Test that ThemeProvider renders correctly with default theme
 */
export async function testThemeProviderDefaultTheme(
  page: Page,
  _component: Locator
): Promise<void> {
  // Should have data-vizel-theme attribute on document
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-vizel-theme", /(light|dark)/);
}

/**
 * Test that theme can be toggled
 */
export async function testThemeProviderToggle(page: Page, toggleButton: Locator): Promise<void> {
  const html = page.locator("html");

  // Get initial theme
  const initialTheme = await html.getAttribute("data-vizel-theme");

  // Click toggle button
  await toggleButton.click();

  // Theme should be different
  const newTheme = await html.getAttribute("data-vizel-theme");
  expect(newTheme).not.toBe(initialTheme);

  // Toggle back
  await toggleButton.click();

  // Should be back to initial theme
  const finalTheme = await html.getAttribute("data-vizel-theme");
  expect(finalTheme).toBe(initialTheme);
}

/**
 * Test that theme is persisted to localStorage
 */
export async function testThemeProviderPersistence(
  page: Page,
  toggleButton: Locator,
  storageKey: string = "vizel-theme"
): Promise<void> {
  // Click toggle to change theme
  await toggleButton.click();

  // Check localStorage
  const storedTheme = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(storedTheme).toMatch(/(light|dark)/);
}

/**
 * Test that theme shows current resolved theme
 */
export async function testThemeProviderShowsResolvedTheme(
  _page: Page,
  themeDisplay: Locator
): Promise<void> {
  // Should display current theme
  await expect(themeDisplay).toHaveText(/(light|dark)/);
}

/**
 * Test that CSS variables are applied correctly for light theme
 */
export async function testThemeProviderLightCSS(page: Page): Promise<void> {
  const html = page.locator("html");
  await html.evaluate((el) => el.setAttribute("data-vizel-theme", "light"));

  // Check CSS variables are set for light theme
  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--vizel-bg-color").trim()
  );
  expect(bgColor).toBe("#ffffff");
}

/**
 * Test that CSS variables are applied correctly for dark theme
 */
export async function testThemeProviderDarkCSS(page: Page): Promise<void> {
  const html = page.locator("html");
  await html.evaluate((el) => el.setAttribute("data-vizel-theme", "dark"));

  // Check CSS variables are set for dark theme
  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--vizel-bg-color").trim()
  );
  expect(bgColor).toBe("#1f2937");
}
