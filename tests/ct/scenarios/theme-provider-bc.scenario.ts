import { expect } from "vitest";
import { page, userEvent } from "./_vitest-context";

// Resolve the toggle button rendered by the fixture. Framework components
// mount synchronously, but the VDOM patch may run in the next microtask, so
// poll with a generous budget rather than querying once.
async function resolveToggleButton(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector<HTMLElement>("[data-testid='toggle-theme']"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("[data-testid='toggle-theme']");
  if (el === null) throw new Error("expected a [data-testid='toggle-theme'] element");
  return el;
}

/**
 * Verify ThemeProvider renders with a default theme.
 *
 * The provider sets `data-vizel-theme` on `<html>` to either "light" or
 * "dark", resolving "system" against `prefers-color-scheme`. The scenario
 * asserts the attribute exists and holds one of the two concrete values.
 */
export async function testThemeProviderDefaultTheme(): Promise<void> {
  await expect
    .poll(() => document.documentElement.getAttribute("data-vizel-theme"), { timeout: 5_000 })
    .toMatch(/^(light|dark)$/);
}

/**
 * Verify the theme toggles when the user clicks the toggle button.
 *
 * The test reads the initial resolved theme, clicks the button, confirms the
 * theme flips to the opposite value, then clicks again and confirms the theme
 * returns to the initial value.
 */
export async function testThemeProviderToggle(): Promise<void> {
  const btn = await resolveToggleButton();

  // Wait for the provider to apply the initial theme before reading it.
  await expect
    .poll(() => document.documentElement.getAttribute("data-vizel-theme"), { timeout: 5_000 })
    .toMatch(/^(light|dark)$/);
  const initialTheme = document.documentElement.getAttribute("data-vizel-theme") ?? "";

  await userEvent.click(page.elementLocator(btn));

  const expectedAfterToggle = initialTheme === "light" ? "dark" : "light";
  await expect
    .poll(() => document.documentElement.getAttribute("data-vizel-theme"), { timeout: 5_000 })
    .toBe(expectedAfterToggle);

  // Toggle back and confirm the theme returns to the initial value.
  await userEvent.click(page.elementLocator(btn));
  await expect
    .poll(() => document.documentElement.getAttribute("data-vizel-theme"), { timeout: 5_000 })
    .toBe(initialTheme);
}

/**
 * Verify the provider persists the user's theme choice to `localStorage`.
 *
 * Clicking the toggle button must write the resolved theme under the given
 * storage key. `localStorage` is directly accessible in the browser context,
 * so no `page.evaluate` is needed.
 */
export async function testThemeProviderPersistence(
  storageKey: string = "vizel-theme"
): Promise<void> {
  const btn = await resolveToggleButton();
  await userEvent.click(page.elementLocator(btn));

  // Read localStorage directly; poll because the write may be synchronous-but-batched.
  await expect
    .poll(() => localStorage.getItem(storageKey), { timeout: 5_000 })
    .toMatch(/^(light|dark)$/);
}

/**
 * Verify the resolved theme label renders inside the fixture.
 *
 * The fixture exposes the resolved theme as text under
 * `[data-testid="resolved-theme"]`. The displayed value must be one of the
 * two concrete theme names ("light" or "dark").
 */
export async function testThemeProviderShowsResolvedTheme(): Promise<void> {
  await expect
    .poll(() => document.querySelector("[data-testid='resolved-theme']")?.textContent?.trim(), {
      timeout: 5_000,
    })
    .toMatch(/^(light|dark)$/);
}

/**
 * Verify core CSS variables are defined for the light theme.
 *
 * The scenario sets `data-vizel-theme="light"` directly on `<html>` so the
 * correct CSS selector activates, then reads the CSS custom properties with
 * `getComputedStyle`. Values are checked for presence rather than an exact
 * format because the palette uses OKLCH in modern browsers and HEX elsewhere.
 *
 * The spec file must import `@vizel/core/styles/index.scss` so the stylesheet
 * is loaded; without that import the variables resolve to empty strings.
 */
export async function testThemeProviderLightCSS(): Promise<void> {
  document.documentElement.setAttribute("data-vizel-theme", "light");

  const style = getComputedStyle(document.documentElement);
  // Poll because the CSS cascade may not update until the next animation frame.
  await expect
    .poll(() => style.getPropertyValue("--vizel-background").trim(), { timeout: 5_000 })
    .toBeTruthy();
  expect(style.getPropertyValue("--vizel-foreground").trim()).toBeTruthy();
  expect(style.getPropertyValue("--vizel-primary").trim()).toBeTruthy();
  expect(style.getPropertyValue("--vizel-border").trim()).toBeTruthy();
}

/**
 * Verify core CSS variables are defined for the dark theme.
 *
 * Same approach as `testThemeProviderLightCSS` but switches to the dark
 * theme selector. Values are checked for presence only.
 */
export async function testThemeProviderDarkCSS(): Promise<void> {
  document.documentElement.setAttribute("data-vizel-theme", "dark");

  const style = getComputedStyle(document.documentElement);
  await expect
    .poll(() => style.getPropertyValue("--vizel-background").trim(), { timeout: 5_000 })
    .toBeTruthy();
  expect(style.getPropertyValue("--vizel-foreground").trim()).toBeTruthy();
  expect(style.getPropertyValue("--vizel-primary").trim()).toBeTruthy();
  expect(style.getPropertyValue("--vizel-border").trim()).toBeTruthy();
}

/**
 * Verify typography CSS variables are set to the expected design-token values.
 *
 * These variables are theme-independent; the spec file must import the
 * Vizel stylesheet before calling this scenario.
 */
export function testThemeProviderTypographyVariables(): void {
  const style = getComputedStyle(document.documentElement);
  expect(style.getPropertyValue("--vizel-font-size-base").trim()).toBe("1rem");
  expect(style.getPropertyValue("--vizel-font-size-sm").trim()).toBe("0.875rem");
  expect(style.getPropertyValue("--vizel-font-size-lg").trim()).toBe("1.125rem");
  expect(style.getPropertyValue("--vizel-line-height-normal").trim()).toBe("1.5");
}

/**
 * Verify spacing and radius CSS variables are set to the expected design-token values.
 *
 * These variables are theme-independent; the spec file must import the
 * Vizel stylesheet before calling this scenario.
 */
export function testThemeProviderSpacingVariables(): void {
  const style = getComputedStyle(document.documentElement);
  expect(style.getPropertyValue("--vizel-spacing-1").trim()).toBe("0.25rem");
  expect(style.getPropertyValue("--vizel-spacing-2").trim()).toBe("0.5rem");
  expect(style.getPropertyValue("--vizel-spacing-4").trim()).toBe("1rem");
  expect(style.getPropertyValue("--vizel-radius-md").trim()).toBe("0.375rem");
  expect(style.getPropertyValue("--vizel-radius-lg").trim()).toBe("0.5rem");
}
