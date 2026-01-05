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
  // Wait for slash menu to appear
  await expect(page.locator(".vizel-slash-menu")).toBeVisible();
  await page.keyboard.press("Enter");
  // Wait for code block to be inserted
  await expect(component.locator(CODE_BLOCK_SELECTOR)).toBeVisible();
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

/** Verify Enter key in language input doesn't add newline to editor */
export async function testCodeBlockLanguageInputEnterKey(
  component: Locator,
  page: Page
): Promise<void> {
  await insertCodeBlock(component, page);

  // Type some code first
  await page.keyboard.type("line1");

  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  const code = codeBlock.locator("code");

  // Get initial content
  const initialContent = await code.textContent();

  // Click language input and press Enter
  const languageInput = component.locator(LANGUAGE_INPUT_SELECTOR);
  await languageInput.click();
  await languageInput.fill("typescript");
  await page.keyboard.press("Enter");

  // Verify language was changed
  await expect(languageInput).toHaveValue("typescript");

  // Verify no newline was added to the code block
  const finalContent = await code.textContent();
  expect(finalContent).toBe(initialContent);
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

  const codeBlock = component.locator(CODE_BLOCK_SELECTOR);
  const code = codeBlock.locator("code");

  // Set language to JavaScript
  const languageInput = component.locator(LANGUAGE_INPUT_SELECTOR);
  await languageInput.click();
  await languageInput.fill("javascript");
  await expect(languageInput).toHaveValue("javascript");

  // Click on the code block to ensure focus is in the code area
  await codeBlock.click();

  // Type some code slowly to ensure all characters are captured
  await page.keyboard.type("const x = 42;", { delay: 10 });

  // Verify the code was typed
  await expect(code).toContainText("const x = 42;");

  // Should have hljs classes for syntax highlighting
  // Use expect.poll to retry checking for syntax highlighting elements
  // as lowlight applies decorations asynchronously
  await expect
    .poll(
      async () => {
        const hlElements = code.locator("[class^='hljs-']");
        return await hlElements.count();
      },
      { timeout: 10000 }
    )
    .toBeGreaterThan(0);
}
