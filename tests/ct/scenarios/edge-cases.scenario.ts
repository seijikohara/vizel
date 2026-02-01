import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared edge case test scenarios.
 * These scenarios test error handling, boundary conditions, and composite operations.
 */

// ============================================================================
// Empty State Edge Cases
// ============================================================================

/** Verify empty editor has correct initial state */
export async function testEditorEmptyState(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Empty editor should have a single empty paragraph
  const paragraphs = editor.locator("p");
  await expect(paragraphs).toHaveCount(1);

  // The empty paragraph should have the empty node class from Placeholder extension
  await expect(paragraphs.first()).toHaveClass(/vizel-node-empty/);
}

/** Verify empty editor markdown export produces empty/minimal output */
export async function testMarkdownEmptyExport(component: Locator, _page: Page): Promise<void> {
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // Empty editor may produce empty string or "&nbsp;" (browser-dependent)
  const markdownOutput = component.locator("[data-testid='markdown-output']");
  await expect(markdownOutput).toHaveText(/^(\s*|&nbsp;)$/);
}

// ============================================================================
// Special Characters Edge Cases
// ============================================================================

/** Verify editor handles Unicode and emoji characters */
export async function testSpecialCharacters(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await page.keyboard.type("日本語テスト emoji: 🎉🚀 symbols: ©®™");
  await expect(editor).toContainText("日本語テスト");
  await expect(editor).toContainText("🎉🚀");
  await expect(editor).toContainText("©®™");
}

/** Verify HTML-like characters are not rendered as HTML elements */
export async function testHtmlEscaping(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type raw angle brackets and ampersand - these should appear as text, not HTML
  await page.keyboard.type("<script>alert(1)</script> & test");
  await expect(editor).toContainText("<script>");
  await expect(editor).toContainText("</script>");
  await expect(editor).toContainText("& test");

  // Verify no actual <script> element was created in the editor DOM
  const scriptElements = editor.locator("script");
  await expect(scriptElements).toHaveCount(0);

  // The text should be inside a paragraph, not rendered as HTML structure
  const paragraph = editor.locator("p");
  await expect(paragraph).toContainText("<script>alert(1)</script>");
}

// ============================================================================
// Undo/Redo Composite Operations
// ============================================================================

/** Verify undo/redo works across formatting operations */
export async function testUndoRedoFormatting(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type text
  await page.keyboard.type("Hello World");
  await expect(editor).toContainText("Hello World");

  // Select all and apply bold
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+b");

  // Verify bold is applied
  const bold = editor.locator("strong");
  await expect(bold).toContainText("Hello World");

  // Undo bold
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("strong")).toHaveCount(0);
  await expect(editor).toContainText("Hello World");

  // Redo bold
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(editor.locator("strong")).toContainText("Hello World");
}

/** Verify undo works across multiple operation types */
export async function testUndoMultipleOperations(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type text
  await page.keyboard.type("Hello");
  await expect(editor).toContainText("Hello");

  // Apply bold
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+b");
  await expect(editor.locator("strong")).toContainText("Hello");

  // Apply italic on top
  await page.keyboard.press("ControlOrMeta+i");
  await expect(editor.locator("em")).toContainText("Hello");

  // Undo italic
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("em")).toHaveCount(0);
  // Bold should still be there
  await expect(editor.locator("strong")).toContainText("Hello");

  // Undo bold
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("strong")).toHaveCount(0);
  await expect(editor).toContainText("Hello");
}

// ============================================================================
// Rapid Operations Edge Cases
// ============================================================================

/** Verify rapid formatting toggles don't corrupt state */
export async function testRapidFormattingToggles(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await page.keyboard.type("Test");
  await page.keyboard.press("ControlOrMeta+a");

  // Rapidly toggle bold 5 times (odd = bold on)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("ControlOrMeta+b");
  }

  // After odd number of toggles, bold should be active
  const bold = editor.locator("strong");
  await expect(bold).toBeVisible();
  await expect(bold).toContainText("Test");

  // Toggle once more (even = bold off)
  await page.keyboard.press("ControlOrMeta+b");
  await expect(editor.locator("strong")).toHaveCount(0);
  await expect(editor).toContainText("Test");
}

// ============================================================================
// Markdown Edge Cases
// ============================================================================

/** Verify markdown export preserves special characters */
export async function testMarkdownSpecialCharsExport(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  await page.keyboard.type("Special: 日本語 🎉 ©");

  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  const markdownOutput = component.locator("[data-testid='markdown-output']");
  await expect(markdownOutput).toContainText("日本語");
  await expect(markdownOutput).toContainText("🎉");
}

/** Verify markdown import renders blockquote correctly */
export async function testMarkdownNestedContent(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with blockquote (uses existing fixture button)
  const importButton = component.locator("[data-testid='import-blockquote-button']");
  await importButton.click();

  // Verify blockquote was rendered correctly
  const blockquote = editor.locator("blockquote");
  await expect(blockquote).toBeVisible();
  await expect(blockquote).toContainText("This is a quote");
}
