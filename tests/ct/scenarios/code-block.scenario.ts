import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for CodeBlock with syntax highlighting.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const CODE_BLOCK_SELECTOR = ".vizel-code-block";
const LANGUAGE_INPUT_SELECTOR = ".vizel-code-block-language-input";
const LINE_NUMBERS_TOGGLE_SELECTOR = ".vizel-code-block-line-numbers-toggle";

/** Helper to insert a code block via slash command */
async function insertCodeBlock(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/code");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
}

/** Verify code block can be inserted via slash command */
export async function testCodeBlockInsert(component: Locator, page: Page): Promise<void> {
  await insertCodeBlock(component, page);

  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  await expect(codeBlock).toBeVisible();
}

/** Verify code block has language selector */
export async function testCodeBlockHasLanguageSelector(
  component: Locator,
  page: Page
): Promise<void> {
  await insertCodeBlock(component, page);

  const languageInput = component.locator(LANGUAGE_INPUT_SELECTOR);
  await expect(languageInput).toBeVisible();
}

/** Verify language can be changed */
export async function testCodeBlockLanguageChange(component: Locator, page: Page): Promise<void> {
  await insertCodeBlock(component, page);

  const languageInput = component.locator(LANGUAGE_INPUT_SELECTOR);
  await languageInput.click();
  await languageInput.fill("python");
  await languageInput.blur();

  await expect(languageInput).toHaveValue("python");
}

/** Verify line numbers toggle button exists */
export async function testCodeBlockHasLineNumbersToggle(
  component: Locator,
  page: Page
): Promise<void> {
  await insertCodeBlock(component, page);

  const toggleButton = component.locator(LINE_NUMBERS_TOGGLE_SELECTOR);
  await expect(toggleButton).toBeVisible();
}

/** Verify line numbers can be toggled */
export async function testCodeBlockLineNumbersToggle(
  component: Locator,
  page: Page
): Promise<void> {
  await insertCodeBlock(component, page);

  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  const toggleButton = component.locator(LINE_NUMBERS_TOGGLE_SELECTOR);

  // Initially should not have line numbers class
  await expect(codeBlock).not.toHaveClass(/vizel-code-block-line-numbers/);

  // Click toggle to enable line numbers
  await toggleButton.click();
  await expect(codeBlock).toHaveClass(/vizel-code-block-line-numbers/);

  // Click toggle again to disable line numbers
  await toggleButton.click();
  await expect(codeBlock).not.toHaveClass(/vizel-code-block-line-numbers/);
}

/** Verify code can be typed in code block */
export async function testCodeBlockTyping(component: Locator, page: Page): Promise<void> {
  await insertCodeBlock(component, page);

  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  const code = codeBlock.locator("code");

  await page.keyboard.type('const hello = "world";');

  await expect(code).toContainText('const hello = "world";');
}

/** Verify syntax highlighting is applied */
export async function testCodeBlockSyntaxHighlighting(
  component: Locator,
  page: Page
): Promise<void> {
  await insertCodeBlock(component, page);

  // Set language to JavaScript
  const languageInput = component.locator(LANGUAGE_INPUT_SELECTOR);
  await languageInput.click();
  await languageInput.fill("javascript");
  await languageInput.blur();

  // Type some code
  await page.keyboard.type("const x = 42;");

  // Check for highlight.js classes
  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  const code = codeBlock.locator("code");

  // Should have hljs classes for syntax highlighting
  const hlElements = code.locator("[class^='hljs-']");
  await expect(hlElements.first()).toBeVisible();
}
