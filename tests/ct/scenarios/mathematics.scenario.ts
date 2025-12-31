import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Mathematics (LaTeX) support.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const MATH_BLOCK_SELECTOR = ".vizel-math-block";
const MATH_INLINE_SELECTOR = ".vizel-math-inline";

/** Helper to click editor to focus it */
async function clickEditorStart(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  // Click at the center of the editor to avoid overlap with drag handle
  await editor.click();
  // Dismiss any bubble menu
  await page.keyboard.press("Escape");
  await page.waitForTimeout(50);
}

/** Helper to insert a math block via slash command */
async function insertMathBlock(component: Locator, page: Page): Promise<void> {
  await clickEditorStart(component, page);
  await page.keyboard.type("/math");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
}

/** Helper to insert inline math via slash command */
async function insertInlineMath(component: Locator, page: Page): Promise<void> {
  await clickEditorStart(component, page);
  await page.keyboard.type("/inline");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
}

/** Verify math block can be inserted via slash command */
export async function testMathBlockInsert(component: Locator, page: Page): Promise<void> {
  await insertMathBlock(component, page);

  const mathBlock = component.locator(MATH_BLOCK_SELECTOR);
  await expect(mathBlock).toBeVisible();
}

/** Verify inline math can be inserted via slash command */
export async function testInlineMathInsert(component: Locator, page: Page): Promise<void> {
  await insertInlineMath(component, page);

  const mathInline = component.locator(MATH_INLINE_SELECTOR);
  await expect(mathInline).toBeVisible();
}

/** Verify math block can be edited by clicking */
export async function testMathBlockClickToEdit(component: Locator, page: Page): Promise<void> {
  await insertMathBlock(component, page);

  const mathBlock = component.locator(MATH_BLOCK_SELECTOR);
  // Click the render container to start editing
  const renderContainer = mathBlock.locator(".vizel-math-render");
  await renderContainer.click();

  // Should show edit mode with textarea
  const textarea = mathBlock.locator("textarea");
  await expect(textarea).toBeVisible();
}

/** Verify LaTeX can be typed in math block */
export async function testMathBlockTyping(component: Locator, page: Page): Promise<void> {
  await insertMathBlock(component, page);

  const mathBlock = component.locator(MATH_BLOCK_SELECTOR);
  // Click the render container to start editing
  const renderContainer = mathBlock.locator(".vizel-math-render");
  await renderContainer.click();

  const textarea = mathBlock.locator("textarea");
  await expect(textarea).toBeVisible();
  // Use evaluate for reliable cross-browser value setting
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.focus();
    el.value = "E = mc^2";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(100);

  // Blur the textarea to save content
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.blur();
  });
  await page.waitForTimeout(500);

  // Verify the math is rendered
  const katexElement = mathBlock.locator(".vizel-math-render .katex");
  await expect(katexElement).toBeVisible({ timeout: 10000 });
}

/** Verify inline math can be inserted via $...$ syntax */
export async function testInlineMathInputRule(component: Locator, page: Page): Promise<void> {
  await clickEditorStart(component, page);

  // Type inline math using $...$ syntax
  await page.keyboard.type("$E=mc^2$");
  await page.waitForTimeout(300);

  // Should create an inline math element
  const mathInline = component.locator(MATH_INLINE_SELECTOR);
  await expect(mathInline).toBeVisible();
}

/** Verify KaTeX renders the math expression with special symbols */
export async function testKaTeXRendering(component: Locator, page: Page): Promise<void> {
  await insertMathBlock(component, page);

  const mathBlock = component.locator(MATH_BLOCK_SELECTOR);
  // Click the render container to start editing
  const renderContainer = mathBlock.locator(".vizel-math-render");
  await renderContainer.click();

  const textarea = mathBlock.locator("textarea");
  await expect(textarea).toBeVisible();
  // Use evaluate for reliable cross-browser value setting
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.focus();
    el.value = "\\sum_{i=1}^{n} i";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(100);

  // Blur the textarea to save content
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.blur();
  });
  await page.waitForTimeout(500);

  // Should have KaTeX rendered elements
  const katexElement = mathBlock.locator(".vizel-math-render .katex");
  await expect(katexElement).toBeVisible({ timeout: 10000 });

  // Verify the content contains the rendered math (check for katex-html)
  const katexHtml = mathBlock.locator(".vizel-math-render .katex-html");
  await expect(katexHtml).toBeVisible({ timeout: 10000 });
}
