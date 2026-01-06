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
 * Note: Values are checked for existence rather than specific format
 * to support both HEX and OKLCH color formats.
 */
export async function testThemeProviderLightCSS(page: Page): Promise<void> {
  const html = page.locator("html");
  await html.evaluate((el) => el.setAttribute("data-vizel-theme", "light"));

  // Check core CSS variables are set for light theme
  const variables = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      background: style.getPropertyValue("--vizel-background").trim(),
      foreground: style.getPropertyValue("--vizel-foreground").trim(),
      primary: style.getPropertyValue("--vizel-primary").trim(),
      border: style.getPropertyValue("--vizel-border").trim(),
      // Legacy alias for backward compatibility
      bgColor: style.getPropertyValue("--vizel-bg-color").trim(),
    };
  });

  // Verify that CSS variables are defined and not empty
  expect(variables.background).toBeTruthy();
  expect(variables.foreground).toBeTruthy();
  expect(variables.primary).toBeTruthy();
  expect(variables.border).toBeTruthy();
  expect(variables.bgColor).toBeTruthy();
}

/**
 * Test that CSS variables are applied correctly for dark theme
 * Note: Values are checked for existence rather than specific format
 * to support both HEX and OKLCH color formats.
 */
export async function testThemeProviderDarkCSS(page: Page): Promise<void> {
  const html = page.locator("html");
  await html.evaluate((el) => el.setAttribute("data-vizel-theme", "dark"));

  // Check core CSS variables are set for dark theme
  const variables = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      background: style.getPropertyValue("--vizel-background").trim(),
      foreground: style.getPropertyValue("--vizel-foreground").trim(),
      primary: style.getPropertyValue("--vizel-primary").trim(),
      border: style.getPropertyValue("--vizel-border").trim(),
      // Legacy alias for backward compatibility
      bgColor: style.getPropertyValue("--vizel-bg-color").trim(),
    };
  });

  // Verify that CSS variables are defined and not empty
  expect(variables.background).toBeTruthy();
  expect(variables.foreground).toBeTruthy();
  expect(variables.primary).toBeTruthy();
  expect(variables.border).toBeTruthy();
  expect(variables.bgColor).toBeTruthy();
}

/**
 * Test that typography CSS variables are defined
 */
export async function testThemeProviderTypographyVariables(page: Page): Promise<void> {
  const variables = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      fontSizeBase: style.getPropertyValue("--vizel-font-size-base").trim(),
      fontSizeSm: style.getPropertyValue("--vizel-font-size-sm").trim(),
      fontSizeLg: style.getPropertyValue("--vizel-font-size-lg").trim(),
      lineHeightNormal: style.getPropertyValue("--vizel-line-height-normal").trim(),
    };
  });

  expect(variables.fontSizeBase).toBe("1rem");
  expect(variables.fontSizeSm).toBe("0.875rem");
  expect(variables.fontSizeLg).toBe("1.125rem");
  expect(variables.lineHeightNormal).toBe("1.5");
}

/**
 * Test that spacing CSS variables are defined
 */
export async function testThemeProviderSpacingVariables(page: Page): Promise<void> {
  const variables = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      spacing1: style.getPropertyValue("--vizel-spacing-1").trim(),
      spacing2: style.getPropertyValue("--vizel-spacing-2").trim(),
      spacing4: style.getPropertyValue("--vizel-spacing-4").trim(),
      radiusMd: style.getPropertyValue("--vizel-radius-md").trim(),
      radiusLg: style.getPropertyValue("--vizel-radius-lg").trim(),
    };
  });

  expect(variables.spacing1).toBe("0.25rem");
  expect(variables.spacing2).toBe("0.5rem");
  expect(variables.spacing4).toBe("1rem");
  expect(variables.radiusMd).toBe("0.375rem");
  expect(variables.radiusLg).toBe("0.5rem");
}
