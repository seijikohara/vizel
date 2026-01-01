import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Embed functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const BUBBLE_MENU_SELECTOR = "[data-vizel-bubble-menu]";

/** Helper to select text in the editor */
async function selectTextInEditor(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Check this link");
  await page.keyboard.press("ControlOrMeta+a");
}

/** Verify embed toggle appears for known provider URLs */
export async function testEmbedToggleAppearsForKnownProvider(
  component: Locator,
  page: Page
): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  await expect(linkEditor).toBeVisible();

  // Enter a YouTube URL
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // Embed toggle should appear
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle");
  await expect(embedToggle).toBeVisible();
}

/** Verify embed toggle does NOT appear for unknown provider URLs */
export async function testEmbedToggleHiddenForUnknownProvider(
  component: Locator,
  page: Page
): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  await expect(linkEditor).toBeVisible();

  // Enter a generic URL (not a known provider)
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://example.com");

  // Embed toggle should NOT appear
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle");
  await expect(embedToggle).not.toBeVisible();
}

/** Verify link is set as embed when toggle is checked */
export async function testSetLinkAsEmbed(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // Check the embed toggle
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle input");
  await embedToggle.check();

  // Submit
  await linkEditor.locator('button[type="submit"]').click();

  // Link editor should close
  await expect(linkEditor).not.toBeVisible();

  // Verify embed node was created
  const editor = component.locator(".vizel-editor");
  const embed = editor.locator('[data-vizel-embed="true"]');
  await expect(embed).toBeVisible();
}

/** Verify link is set normally when embed toggle is not checked */
export async function testSetLinkWithoutEmbed(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // Do NOT check the embed toggle, submit directly
  await linkEditor.locator('button[type="submit"]').click();

  // Link editor should close
  await expect(linkEditor).not.toBeVisible();

  // Verify link was created (not embed)
  const editor = component.locator(".vizel-editor");
  const link = editor.locator("a");
  await expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // No embed node should exist
  const embed = editor.locator('[data-vizel-embed="true"]');
  await expect(embed).toHaveCount(0);
}

/** Verify Twitter URL is detected as known provider */
export async function testTwitterProviderDetection(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://twitter.com/user/status/1234567890");

  // Embed toggle should appear for Twitter
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle");
  await expect(embedToggle).toBeVisible();
}

/** Verify Vimeo URL is detected as known provider */
export async function testVimeoProviderDetection(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://vimeo.com/123456789");

  // Embed toggle should appear for Vimeo
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle");
  await expect(embedToggle).toBeVisible();
}

/** Verify Spotify URL is detected as known provider */
export async function testSpotifyProviderDetection(component: Locator, page: Page): Promise<void> {
  await selectTextInEditor(component, page);

  const bubbleMenu = component.locator(BUBBLE_MENU_SELECTOR);
  const linkButton = bubbleMenu.locator('[data-action="link"]');
  await linkButton.click();

  const linkEditor = component.locator(".vizel-link-editor");
  const urlInput = linkEditor.locator(".vizel-link-input");
  await urlInput.fill("https://open.spotify.com/track/abc123");

  // Embed toggle should appear for Spotify
  const embedToggle = linkEditor.locator(".vizel-link-editor-embed-toggle");
  await expect(embedToggle).toBeVisible();
}
