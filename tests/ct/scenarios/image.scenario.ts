import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Image functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";
const TEST_IMAGE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23ccc' width='200' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ETest%3C/text%3E%3C/svg%3E";

/**
 * Helper to insert an image via slash command using prompt mock
 */
async function insertImageViaSlashCommand(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Mock window.prompt to return test image URL
  await page.evaluate((url) => {
    window.prompt = () => url;
  }, TEST_IMAGE_URL);

  // Type "/" to open full slash menu (not filtering)
  await page.keyboard.type("/");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Find "Image" item - use exact title match via data attribute or first match
  // The menu items have title and description, so we look for the item containing "Image"
  // but not "Upload Image" by checking description text
  const imageItem = slashMenu
    .locator(".vizel-slash-menu-item")
    .filter({ hasText: "Insert an image from URL" });
  await imageItem.click();

  // Wait for slash menu to close
  await expect(slashMenu).not.toBeVisible();
}

/** Verify image can be inserted via slash command */
export async function testImageInsertViaSlashCommand(
  component: Locator,
  page: Page
): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", TEST_IMAGE_URL);
}

/** Verify image renders with correct CSS class */
export async function testImageRendersWithClass(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  await expect(image).toHaveClass(/vizel-image/);
}

/** Verify image can be selected by clicking */
export async function testImageSelection(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();

  // Click on the image to select it
  await image.click();

  // The image wrapper should have ProseMirror selected node class
  const selectedWrapper = editor.locator("[data-resize-wrapper].ProseMirror-selectednode");
  await expect(selectedWrapper).toBeVisible();
}

/** Verify image can be deleted with Backspace key */
export async function testImageDeleteWithBackspace(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();

  // Click on the image to select it
  await image.click();

  // Press Backspace to delete
  await page.keyboard.press("Backspace");

  // Image should be deleted
  await expect(image).not.toBeVisible();
}

/** Verify image can be deleted with Delete key */
export async function testImageDeleteWithDelete(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();

  // Click on the image to select it
  await image.click();

  // Press Delete to delete
  await page.keyboard.press("Delete");

  // Image should be deleted
  await expect(image).not.toBeVisible();
}

/** Verify image slash command appears in menu */
export async function testImageInSlashMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Should show "Image" item (with description "Insert an image from URL")
  const imageItem = slashMenu
    .locator(".vizel-slash-menu-item")
    .filter({ hasText: "Insert an image from URL" });
  await expect(imageItem).toBeVisible();
}

/** Verify Upload Image slash command appears in menu */
export async function testUploadImageInSlashMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("/upload");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Should show "Upload Image" item
  const uploadItem = slashMenu.locator(".vizel-slash-menu-item", {
    hasText: "Upload Image",
  });
  await expect(uploadItem).toBeVisible();
}
