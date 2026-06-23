import { expect } from "vitest";
import { page } from "./_vitest-context";

// Resolve the save-indicator root element. Framework components mount
// synchronously but the VDOM patch may still run in the next microtask, so
// poll with a generous budget to avoid racing on a contended nine-browser matrix.
async function resolveSaveIndicator(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("[data-vizel-save-indicator]"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("[data-vizel-save-indicator]");
  if (el === null) throw new Error("expected a [data-vizel-save-indicator] element");
  return el;
}

/**
 * Verify the SaveIndicator renders with "saved" status — correct modifier class and label.
 */
export async function testSaveIndicatorSaved(): Promise<void> {
  const el = await resolveSaveIndicator();
  const locator = page.elementLocator(el);
  await expect.element(locator).toBeVisible();
  await expect.element(locator).toHaveClass(/vizel-save-indicator--saved/);
  await expect.element(locator).toHaveTextContent(/Saved/);
  await testSaveIndicatorIcons(el);
}

/**
 * Verify the SaveIndicator renders with "saving" status — correct modifier class and label.
 */
export async function testSaveIndicatorSaving(): Promise<void> {
  const el = await resolveSaveIndicator();
  const locator = page.elementLocator(el);
  await expect.element(locator).toBeVisible();
  await expect.element(locator).toHaveClass(/vizel-save-indicator--saving/);
  await expect.element(locator).toHaveTextContent(/Saving/);
  await testSaveIndicatorIcons(el);
}

/**
 * Verify the SaveIndicator renders with "unsaved" status — correct modifier class and label.
 */
export async function testSaveIndicatorUnsaved(): Promise<void> {
  const el = await resolveSaveIndicator();
  const locator = page.elementLocator(el);
  await expect.element(locator).toBeVisible();
  await expect.element(locator).toHaveClass(/vizel-save-indicator--unsaved/);
  await expect.element(locator).toHaveTextContent(/Unsaved/);
  await testSaveIndicatorIcons(el);
}

/**
 * Verify the SaveIndicator renders with "error" status — correct modifier class and label.
 */
export async function testSaveIndicatorError(): Promise<void> {
  const el = await resolveSaveIndicator();
  const locator = page.elementLocator(el);
  await expect.element(locator).toBeVisible();
  await expect.element(locator).toHaveClass(/vizel-save-indicator--error/);
  await expect.element(locator).toHaveTextContent(/Error/);
  await testSaveIndicatorIcons(el);
}

// Verify the icon slot is present. The icon is always rendered regardless of
// status, so this is a shared helper used by every status check above.
async function testSaveIndicatorIcons(root: HTMLElement): Promise<void> {
  const icon = root.querySelector(".vizel-save-indicator-icon");
  if (icon === null) throw new Error("expected a .vizel-save-indicator-icon element");
  await expect.element(page.elementLocator(icon)).toBeVisible();
}

/**
 * Verify the SaveIndicator shows a relative-time timestamp when `lastSaved` is
 * set and `showTimestamp` is true (or defaulted to true).
 */
export async function testSaveIndicatorTimestamp(): Promise<void> {
  const el = await resolveSaveIndicator();
  const timestamp = el.querySelector(".vizel-save-indicator-timestamp");
  if (timestamp === null) throw new Error("expected a .vizel-save-indicator-timestamp element");
  await expect.element(page.elementLocator(timestamp)).toBeVisible();
  // The ticker formats the date as "Just now" or "<n>s ago", "<n>m ago", etc.
  await expect.element(page.elementLocator(timestamp)).toHaveTextContent(/(Just now|ago)/);
}

/**
 * Verify the SaveIndicator hides the timestamp element when `showTimestamp`
 * is false or when `lastSaved` is null.
 */
export async function testSaveIndicatorHideTimestamp(): Promise<void> {
  const el = await resolveSaveIndicator();
  // The timestamp span is omitted entirely (not just hidden) when the condition
  // is false, so the element may be absent from the DOM.
  const timestamp = el.querySelector(".vizel-save-indicator-timestamp");
  if (timestamp !== null) {
    await expect.element(page.elementLocator(timestamp)).not.toBeVisible();
  }
  // No assertion needed when the element is absent: its absence proves the condition.
}

/**
 * Verify the SaveIndicator applies a custom class name to the root element.
 *
 * The `customClass` value is the string passed as `className` (React) or
 * `class` (Vue / Svelte) to the fixture.
 */
export async function testSaveIndicatorCustomClass(customClass: string): Promise<void> {
  const el = await resolveSaveIndicator();
  await expect.element(page.elementLocator(el)).toHaveClass(new RegExp(customClass));
}
