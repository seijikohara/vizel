import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Markdown flavor-specific output.
 *
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 * They test that callout nodes are serialized differently depending on the
 * configured Markdown flavor (gfm, obsidian, docusaurus, commonmark).
 *
 * The fixture must provide:
 * - A button `[data-testid="insert-callout"]` that inserts a callout with type "info"
 *   and content "Test callout content"
 * - A button `[data-testid="export-button"]` that exports markdown to `[data-testid="markdown-output"]`
 * - A button `[data-testid="import-callout-gfm"]` that imports GFM-style callout markdown
 * - A button `[data-testid="import-callout-obsidian"]` that imports Obsidian-style callout markdown
 * - A button `[data-testid="import-callout-docusaurus"]` that imports Docusaurus-style callout markdown
 */

/**
 * Wait for the editor to be ready before interacting.
 */
async function waitForEditor(component: Locator): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible({ timeout: 10000 });
}

/**
 * Test that the editor serializes callouts according to the GFM flavor.
 * Expected output: `> [!NOTE]\n> content`
 */
export async function testCalloutGfmOutput(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Insert callout via button
  const insertButton = component.locator("[data-testid='insert-callout']");
  await insertButton.click();

  // Export markdown
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // GFM uses uppercase alert syntax: > [!NOTE]
  await expect(markdownOutput).toContainText("> [!NOTE]");
  await expect(markdownOutput).toContainText("Test callout content");
}

/**
 * Test that the editor serializes callouts according to the Obsidian flavor.
 * Expected output: `> [!info]\n> content`
 */
export async function testCalloutObsidianOutput(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Insert callout via button
  const insertButton = component.locator("[data-testid='insert-callout']");
  await insertButton.click();

  // Export markdown
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // Obsidian uses lowercase callout syntax: > [!info]
  await expect(markdownOutput).toContainText("> [!info]");
  await expect(markdownOutput).toContainText("Test callout content");
}

/**
 * Test that the editor serializes callouts according to the Docusaurus flavor.
 * Expected output: `:::info\ncontent\n:::`
 */
export async function testCalloutDocusaurusOutput(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Insert callout via button
  const insertButton = component.locator("[data-testid='insert-callout']");
  await insertButton.click();

  // Export markdown
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // Docusaurus uses directive syntax: :::info
  await expect(markdownOutput).toContainText(":::info");
  await expect(markdownOutput).toContainText("Test callout content");
  // Closing directive
  await expect(markdownOutput).toContainText(":::");
}

/**
 * Test that the editor serializes callouts according to the CommonMark flavor.
 * Expected output: `> **Info**: content`
 */
export async function testCalloutCommonmarkOutput(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Insert callout via button
  const insertButton = component.locator("[data-testid='insert-callout']");
  await insertButton.click();

  // Export markdown
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  // CommonMark uses blockquote fallback: > **Info**: content
  await expect(markdownOutput).toContainText("> **Info**:");
  await expect(markdownOutput).toContainText("Test callout content");
}

/**
 * Test that GFM-style callout markdown is parsed correctly regardless of flavor.
 * Input parsing is always tolerant.
 */
export async function testCalloutParseGfm(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const editor = component.locator(".vizel-editor");

  // Import GFM-style callout
  const importButton = component.locator("[data-testid='import-callout-gfm']");
  await importButton.click();

  // Verify callout was rendered in the editor
  const callout = editor.locator("[data-callout]");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("GFM callout content");
}

/**
 * Test that Obsidian-style callout markdown is parsed correctly regardless of flavor.
 * Input parsing is always tolerant.
 */
export async function testCalloutParseObsidian(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const editor = component.locator(".vizel-editor");

  // Import Obsidian-style callout
  const importButton = component.locator("[data-testid='import-callout-obsidian']");
  await importButton.click();

  // Verify callout was rendered in the editor
  const callout = editor.locator("[data-callout]");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("Obsidian callout content");
}

/**
 * Test that Docusaurus-style callout markdown is parsed correctly regardless of flavor.
 * Input parsing is always tolerant.
 */
export async function testCalloutParseDocusaurus(component: Locator, _page: Page): Promise<void> {
  await waitForEditor(component);
  const editor = component.locator(".vizel-editor");

  // Import Docusaurus-style callout
  const importButton = component.locator("[data-testid='import-callout-docusaurus']");
  await importButton.click();

  // Verify callout was rendered in the editor
  const callout = editor.locator("[data-callout]");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("Docusaurus callout content");
}

/**
 * Test roundtrip: import callout markdown, then export and verify the output matches
 * the configured flavor format.
 */
export async function testCalloutRoundtrip(
  component: Locator,
  _page: Page,
  expectedPattern: RegExp
): Promise<void> {
  await waitForEditor(component);
  const markdownOutput = component.locator("[data-testid='markdown-output']");

  // Import GFM-style callout (all flavors should parse this)
  const importButton = component.locator("[data-testid='import-callout-gfm']");
  await importButton.click();

  // Verify callout was rendered
  const editor = component.locator(".vizel-editor");
  const callout = editor.locator("[data-callout]");
  await expect(callout).toBeVisible();

  // Export and verify the output matches the configured flavor
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  const output = await markdownOutput.textContent();
  expect(output).toMatch(expectedPattern);
}
