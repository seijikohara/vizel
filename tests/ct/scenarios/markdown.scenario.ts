import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test that Markdown extension can export editor content as markdown
 */
export async function testMarkdownExport(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Type content with formatting
  await editor.click();
  await page.keyboard.type("Hello ");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("World");
  await page.keyboard.press("ControlOrMeta+b");

  // Click export button
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // Verify markdown output contains bold syntax
  await expect(markdownOutput).toContainText("**World**");
}

/**
 * Test that Markdown extension can import markdown content
 */
export async function testMarkdownImport(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Click import button (which sets content from markdown)
  const importButton = component.locator("[data-testid='import-button']");
  await importButton.click();

  // Verify bold text was rendered
  const bold = editor.locator("strong");
  await expect(bold).toContainText("bold");
}

/**
 * Test that Markdown extension preserves heading structure
 */
export async function testMarkdownHeading(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Create a heading
  await editor.click();
  await page.keyboard.type("My Heading");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+Alt+1");

  // Export and verify
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  await expect(markdownOutput).toContainText("# My Heading");
}

/**
 * Test that Markdown extension handles lists correctly
 */
export async function testMarkdownList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Create a bullet list
  await editor.click();
  await page.keyboard.type("- Item 1");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Item 2");

  // Export and verify
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  await expect(markdownOutput).toContainText("- Item 1");
  await expect(markdownOutput).toContainText("- Item 2");
}

/**
 * Test that Markdown extension handles code blocks
 */
export async function testMarkdownCodeBlock(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with code block
  const importCodeButton = component.locator("[data-testid='import-code-button']");
  await importCodeButton.click();

  // Verify code block was rendered
  const codeBlock = editor.locator("pre");
  await expect(codeBlock).toBeVisible();
  await expect(codeBlock).toContainText("const x = 1");
}

/**
 * Test that Markdown extension handles links correctly
 */
export async function testMarkdownLink(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with link
  const importLinkButton = component.locator("[data-testid='import-link-button']");
  await importLinkButton.click();

  // Verify link was rendered
  const link = editor.locator("a");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "https://example.com");
}

/**
 * Test that Markdown extension handles italic text
 */
export async function testMarkdownItalic(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Type content with italic formatting
  await editor.click();
  await page.keyboard.type("Hello ");
  await page.keyboard.press("ControlOrMeta+i");
  await page.keyboard.type("italic");
  await page.keyboard.press("ControlOrMeta+i");
  await page.keyboard.type(" world");

  // Export and verify
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  await expect(markdownOutput).toContainText("*italic*");
}

/**
 * Test that Markdown extension handles strikethrough text
 */
export async function testMarkdownStrikethrough(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with strikethrough
  const importButton = component.locator("[data-testid='import-strikethrough-button']");
  await importButton.click();

  // Verify strikethrough was rendered
  const strike = editor.locator("s");
  await expect(strike).toBeVisible();
  await expect(strike).toContainText("deleted");
}

/**
 * Test that Markdown extension handles inline code
 */
export async function testMarkdownInlineCode(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with inline code
  const importButton = component.locator("[data-testid='import-inline-code-button']");
  await importButton.click();

  // Verify inline code was rendered
  const code = editor.locator("code");
  await expect(code).toBeVisible();
  await expect(code).toContainText("variable");
}

/**
 * Test that Markdown extension handles images
 */
export async function testMarkdownImage(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with image
  const importButton = component.locator("[data-testid='import-image-button']");
  await importButton.click();

  // Verify image was rendered
  const image = editor.locator("img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", "https://example.com/image.png");
  await expect(image).toHaveAttribute("alt", "Example");
}

/**
 * Test that Markdown extension handles ordered lists
 */
export async function testMarkdownOrderedList(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with ordered list
  const importButton = component.locator("[data-testid='import-ordered-list-button']");
  await importButton.click();

  // Verify ordered list was rendered
  const orderedList = editor.locator("ol");
  await expect(orderedList).toBeVisible();
  const items = editor.locator("ol li");
  await expect(items).toHaveCount(3);
}

/**
 * Test that Markdown extension handles blockquotes
 */
export async function testMarkdownBlockquote(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with blockquote
  const importButton = component.locator("[data-testid='import-blockquote-button']");
  await importButton.click();

  // Verify blockquote was rendered
  const blockquote = editor.locator("blockquote");
  await expect(blockquote).toBeVisible();
  await expect(blockquote).toContainText("This is a quote");
}

/**
 * Test that Markdown extension handles horizontal rules
 */
export async function testMarkdownHorizontalRule(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with horizontal rule
  const importButton = component.locator("[data-testid='import-hr-button']");
  await importButton.click();

  // Verify horizontal rule was rendered
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
}

/**
 * Test that Markdown extension handles tables
 */
export async function testMarkdownTable(component: Locator, _page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();

  // Import markdown with table
  const importButton = component.locator("[data-testid='import-table-button']");
  await importButton.click();

  // Verify table was rendered
  const table = editor.locator("table");
  await expect(table).toBeVisible();
  const headerCells = editor.locator("th");
  await expect(headerCells).toHaveCount(2);
  const dataCells = editor.locator("td");
  await expect(dataCells).toHaveCount(2);
}
