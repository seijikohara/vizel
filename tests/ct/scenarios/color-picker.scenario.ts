import { expect } from "vitest";

import { page, userEvent } from "./_vitest-context";

// Resolve the color picker content element. The component mounts synchronously,
// but VDOM patches can land in the next microtask, so poll with a modest budget
// rather than querying once.
async function resolveColorPickerContent(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-color-picker-content"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-color-picker-content");
  if (el === null) throw new Error("expected a .vizel-color-picker-content element");
  return el;
}

// Focus a swatch by index. Playwright's `loc.focus()` becomes a direct DOM call
// in the browser context.
async function focusSwatchAt(index: number): Promise<HTMLElement> {
  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const swatch = swatches[index];
  if (swatch === undefined) throw new Error(`expected swatch at index ${index}`);
  swatch.focus();
  await expect.poll(() => document.activeElement === swatch, { timeout: 3_000 }).toBe(true);
  return swatch;
}

/**
 * Verify the ColorPicker renders the color palette grid with at least one swatch.
 */
export async function testRendersColorPalette(): Promise<void> {
  const content = await resolveColorPickerContent();
  await expect.element(page.elementLocator(content)).toBeVisible();
  expect(content.getAttribute("role")).toBe("listbox");

  const grid = document.querySelector<HTMLElement>(".vizel-color-picker-grid");
  if (grid === null) throw new Error("expected a .vizel-color-picker-grid element");
  await expect.element(page.elementLocator(grid)).toBeVisible();

  const swatches = document.querySelectorAll(".vizel-color-picker-swatch");
  expect(swatches.length).toBeGreaterThan(0);
}

/**
 * Verify the swatch for `expectedColor` carries the active state attributes.
 */
export async function testShowsCurrentSelection(expectedColor: string): Promise<void> {
  await resolveColorPickerContent();

  await expect
    .poll(
      () =>
        document.querySelector<HTMLElement>(
          `.vizel-color-picker-swatch[data-color="${expectedColor}"]`
        ),
      { timeout: 5_000 }
    )
    .not.toBeNull();

  const activeSwatch = document.querySelector<HTMLElement>(
    `.vizel-color-picker-swatch[data-color="${expectedColor}"]`
  );
  if (activeSwatch === null) {
    throw new Error(`expected a swatch with data-color="${expectedColor}"`);
  }
  expect(activeSwatch.classList.contains("is-active")).toBe(true);
  expect(activeSwatch.getAttribute("aria-selected")).toBe("true");
}

/**
 * Verify clicking a color swatch calls onChange and updates the selected color display.
 */
export async function testOnChangeCalledOnSelection(): Promise<void> {
  await resolveColorPickerContent();

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const targetSwatch = swatches[4];
  if (targetSwatch === undefined) throw new Error("expected at least 5 swatches");
  await userEvent.click(page.elementLocator(targetSwatch));

  // The fixture writes the selected color into [data-testid="selected-color"].
  const display = document.querySelector<HTMLElement>("[data-testid='selected-color']");
  if (display === null) throw new Error("expected a [data-testid='selected-color'] element");
  await expect
    .poll(() => (display.textContent ?? "").trim().length > 0, { timeout: 5_000 })
    .toBe(true);
}

/**
 * Verify ArrowRight moves keyboard focus to the next swatch.
 */
export async function testKeyboardNavigationArrowRight(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(0);

  await userEvent.keyboard("{ArrowRight}");

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const second = swatches[1];
  if (second === undefined) throw new Error("expected at least 2 swatches");
  await expect.poll(() => document.activeElement === second, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify ArrowLeft moves keyboard focus to the previous swatch.
 */
export async function testKeyboardNavigationArrowLeft(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(1);

  await userEvent.keyboard("{ArrowLeft}");

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const first = swatches[0];
  if (first === undefined) throw new Error("expected at least 1 swatch");
  await expect.poll(() => document.activeElement === first, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify ArrowDown moves keyboard focus down one row (4 items).
 */
export async function testKeyboardNavigationArrowDown(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(0);

  await userEvent.keyboard("{ArrowDown}");

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const fifth = swatches[4];
  if (fifth === undefined) throw new Error("expected at least 5 swatches");
  await expect.poll(() => document.activeElement === fifth, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify ArrowUp moves keyboard focus up one row (4 items).
 */
export async function testKeyboardNavigationArrowUp(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(4);

  await userEvent.keyboard("{ArrowUp}");

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const first = swatches[0];
  if (first === undefined) throw new Error("expected at least 1 swatch");
  await expect.poll(() => document.activeElement === first, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify Home moves keyboard focus to the first swatch.
 */
export async function testKeyboardNavigationHome(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(10);

  await userEvent.keyboard("{Home}");

  const swatches = document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch");
  const first = swatches[0];
  if (first === undefined) throw new Error("expected at least 1 swatch");
  await expect.poll(() => document.activeElement === first, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify End moves keyboard focus to the last swatch.
 */
export async function testKeyboardNavigationEnd(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(0);

  await userEvent.keyboard("{End}");

  const swatches = Array.from(document.querySelectorAll<HTMLElement>(".vizel-color-picker-swatch"));
  const last = swatches.at(-1);
  if (last === undefined) throw new Error("expected at least 1 swatch");
  await expect.poll(() => document.activeElement === last, { timeout: 3_000 }).toBe(true);
}

/**
 * Verify pressing Enter while a swatch is focused selects that swatch.
 */
export async function testKeyboardNavigationEnterSelect(): Promise<void> {
  await resolveColorPickerContent();

  await focusSwatchAt(5);

  await userEvent.keyboard("{Enter}");

  const display = document.querySelector<HTMLElement>("[data-testid='selected-color']");
  if (display === null) throw new Error("expected a [data-testid='selected-color'] element");
  await expect
    .poll(() => (display.textContent ?? "").trim().length > 0, { timeout: 5_000 })
    .toBe(true);
}

// Fill an input field using click-select-all then type, matching the Playwright
// helper `setInputValue`. Tripling the click selects all existing text so the
// new value replaces the old one.
async function setInputValue(input: HTMLElement, value: string): Promise<void> {
  const locator = page.elementLocator(input);
  await userEvent.click(locator, { clickCount: 3 });
  await userEvent.type(locator, value);
}

/**
 * Verify the custom color input accepts a valid hex value and enables the apply button.
 */
export async function testCustomColorInput(): Promise<void> {
  await resolveColorPickerContent();

  const input = document.querySelector<HTMLElement>(".vizel-color-picker-input");
  if (input === null) throw new Error("expected a .vizel-color-picker-input element");
  await expect.element(page.elementLocator(input)).toBeVisible();
  expect(input.getAttribute("placeholder")).toBe("#000000");

  await setInputValue(input, "#ff5500");
  await expect.element(page.elementLocator(input)).toHaveValue("#ff5500");

  const applyButton = document.querySelector<HTMLElement>(".vizel-color-picker-apply");
  if (applyButton === null) throw new Error("expected a .vizel-color-picker-apply element");
  await expect.element(page.elementLocator(applyButton)).toBeEnabled();

  await userEvent.click(page.elementLocator(applyButton));

  const display = document.querySelector<HTMLElement>("[data-testid='selected-color']");
  if (display === null) throw new Error("expected a [data-testid='selected-color'] element");
  await expect
    .poll(() => /#[fF][fF]5500/.test(display.textContent ?? ""), { timeout: 5_000 })
    .toBe(true);
}

/**
 * Verify the custom color input validates hex colors and enables the apply button only for valid values.
 */
export async function testCustomColorInputValidation(): Promise<void> {
  await resolveColorPickerContent();

  const input = document.querySelector<HTMLElement>(".vizel-color-picker-input");
  if (input === null) throw new Error("expected a .vizel-color-picker-input element");
  const applyButton = document.querySelector<HTMLElement>(".vizel-color-picker-apply");
  if (applyButton === null) throw new Error("expected a .vizel-color-picker-apply element");

  // "notacol" is 7 characters (maxLength) and is not a valid hex color.
  await setInputValue(input, "notacol");
  await expect.element(page.elementLocator(input)).toHaveValue("notacol");
  await expect.element(page.elementLocator(applyButton)).toBeDisabled();

  await setInputValue(input, "#f00");
  await expect.element(page.elementLocator(input)).toHaveValue("#f00");
  await expect.element(page.elementLocator(applyButton)).toBeEnabled();

  await setInputValue(input, "#ff0000");
  await expect.element(page.elementLocator(input)).toHaveValue("#ff0000");
  await expect.element(page.elementLocator(applyButton)).toBeEnabled();
}

/**
 * Verify the recent colors section displays a label and at least one swatch.
 */
export async function testRecentColorsDisplay(): Promise<void> {
  await resolveColorPickerContent();

  const recentLabel = document.querySelector<HTMLElement>(".vizel-color-picker-label");
  if (recentLabel === null) throw new Error("expected a .vizel-color-picker-label element");
  await expect.element(page.elementLocator(recentLabel)).toHaveTextContent("Recent");

  const recentGrid = document.querySelector<HTMLElement>(".vizel-color-picker-recent");
  if (recentGrid === null) throw new Error("expected a .vizel-color-picker-recent element");
  await expect.element(page.elementLocator(recentGrid)).toBeVisible();

  const recentSwatches = recentGrid.querySelectorAll(".vizel-color-picker-swatch");
  expect(recentSwatches.length).toBeGreaterThan(0);
}

/**
 * Verify ARIA attributes on the color picker content and first swatch.
 */
export async function testAccessibilityAttributes(label: string): Promise<void> {
  const content = await resolveColorPickerContent();
  expect(content.getAttribute("role")).toBe("listbox");
  expect(content.getAttribute("aria-label")).toBe(label);

  const firstSwatch = document.querySelector<HTMLElement>(".vizel-color-picker-swatch");
  if (firstSwatch === null) throw new Error("expected at least one .vizel-color-picker-swatch");
  expect(firstSwatch.getAttribute("role")).toBe("option");
}

/**
 * Verify the transparent/none swatch is visible and contains an SVG icon.
 */
export async function testNoneValueDisplay(): Promise<void> {
  await resolveColorPickerContent();

  const noneSwatch = document.querySelector<HTMLElement>(
    '.vizel-color-picker-swatch[data-color="transparent"]'
  );
  if (noneSwatch === null) {
    throw new Error('expected a swatch with data-color="transparent"');
  }
  await expect.element(page.elementLocator(noneSwatch)).toBeVisible();

  const noneIndicator = noneSwatch.querySelector<HTMLElement>(".vizel-color-picker-none");
  if (noneIndicator === null) throw new Error("expected a .vizel-color-picker-none element");
  await expect.element(page.elementLocator(noneIndicator)).toBeVisible();

  const svg = noneIndicator.querySelector("svg");
  if (svg === null) throw new Error("expected an SVG inside .vizel-color-picker-none");
  await expect.element(page.elementLocator(svg)).toBeVisible();
}
