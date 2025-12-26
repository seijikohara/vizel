import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for editor functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Verify the editor is rendered and editable */
export async function testEditorRenders(component: Locator): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("contenteditable", "true");
}

/** Verify typing text into the editor */
export async function testEditorTyping(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Hello, Vizel!");
  await expect(editor).toContainText("Hello, Vizel!");
}

/** Verify placeholder is shown when editor is empty */
export async function testEditorPlaceholder(
  component: Locator,
  expectedPlaceholder: string
): Promise<void> {
  // Placeholder is rendered via CSS ::before pseudo-element with data-placeholder attribute
  const editor = component.locator(".vizel-editor");
  await expect(editor.locator("[data-placeholder]")).toHaveAttribute(
    "data-placeholder",
    expectedPlaceholder
  );
}

/** Verify heading formatting with keyboard shortcut */
export async function testHeadingShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Heading Test");

  // Select all text
  await page.keyboard.press("ControlOrMeta+a");

  // Apply heading (Ctrl/Cmd + Alt + 1)
  await page.keyboard.press("ControlOrMeta+Alt+1");

  const heading = editor.locator("h1");
  await expect(heading).toContainText("Heading Test");
}

/** Verify bold formatting with keyboard shortcut */
export async function testBoldShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type with bold shortcut
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("Bold Text");
  await page.keyboard.press("ControlOrMeta+b");

  const bold = editor.locator("strong");
  await expect(bold).toContainText("Bold Text");
}

/** Verify italic formatting with keyboard shortcut */
export async function testItalicShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type with italic shortcut
  await page.keyboard.press("ControlOrMeta+i");
  await page.keyboard.type("Italic Text");
  await page.keyboard.press("ControlOrMeta+i");

  const italic = editor.locator("em");
  await expect(italic).toContainText("Italic Text");
}

/** Verify bullet list creation */
export async function testBulletList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create bullet list
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  const list = editor.locator("ul");
  await expect(list).toBeVisible();

  const items = editor.locator("li");
  await expect(items).toHaveCount(2);
}

/** Verify ordered list creation */
export async function testOrderedList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create ordered list
  await page.keyboard.type("1. First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  const list = editor.locator("ol");
  await expect(list).toBeVisible();

  const items = editor.locator("li");
  await expect(items).toHaveCount(2);
}
