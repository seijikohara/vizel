import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Image Resize functionality.
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

  // Find "Image" item - use description text to distinguish from "Upload Image"
  const imageItem = slashMenu
    .locator(".vizel-slash-menu-item")
    .filter({ hasText: "Insert an image from URL" });
  await imageItem.click();

  // Wait for slash menu to close and image to be visible
  await expect(slashMenu).not.toBeVisible();

  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();
}

/** Verify resize wrapper is rendered around image */
export async function testResizeWrapperRendered(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const wrapper = editor.locator("[data-resize-wrapper]");
  await expect(wrapper).toBeVisible();
}

/** Verify left resize handle exists */
export async function testLeftResizeHandleExists(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const leftHandle = editor.locator("[data-resize-handle='left']");
  await expect(leftHandle).toBeAttached();
}

/** Verify right resize handle exists */
export async function testRightResizeHandleExists(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const rightHandle = editor.locator("[data-resize-handle='right']");
  await expect(rightHandle).toBeAttached();
}

/** Verify image can be resized by dragging right handle */
export async function testResizeWithRightHandle(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  const rightHandle = editor.locator("[data-resize-handle='right']");

  // Get initial width
  const initialWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);

  // Drag handle to resize (move right by 50px)
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("Handle bounding box not found");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 50,
    handleBox.y + handleBox.height / 2,
    {
      steps: 5,
    }
  );
  await page.mouse.up();

  // Verify width increased
  const newWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(newWidth).toBeGreaterThan(initialWidth);
}

/** Verify image can be resized by dragging left handle */
export async function testResizeWithLeftHandle(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  const leftHandle = editor.locator("[data-resize-handle='left']");

  // Get initial width
  const initialWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);

  // Drag handle to resize (move left by 50px to increase width)
  const handleBox = await leftHandle.boundingBox();
  if (!handleBox) throw new Error("Handle bounding box not found");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 - 50,
    handleBox.y + handleBox.height / 2,
    {
      steps: 5,
    }
  );
  await page.mouse.up();

  // Verify width increased
  const newWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(newWidth).toBeGreaterThan(initialWidth);
}

/** Verify resize tooltip appears during resize */
export async function testResizeTooltipAppears(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const rightHandle = editor.locator("[data-resize-handle='right']");
  const tooltip = editor.locator("[data-resize-tooltip]");

  // Start drag to show tooltip
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("Handle bounding box not found");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 20, handleBox.y + handleBox.height / 2);

  // Tooltip should be visible during resize
  await expect(tooltip).toHaveCSS("display", "block");

  // Tooltip should show dimensions (format: "NNN × NNN")
  await expect(tooltip).toHaveText(/\d+ × \d+/);

  // Release mouse
  await page.mouse.up();

  // Tooltip should be hidden after resize
  await expect(tooltip).toHaveCSS("display", "none");
}

/** Verify minimum width constraint is enforced */
export async function testMinWidthConstraint(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  const leftHandle = editor.locator("[data-resize-handle='left']");

  // Drag handle far to the right to try to shrink image below minimum
  const handleBox = await leftHandle.boundingBox();
  if (!handleBox) throw new Error("Handle bounding box not found");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 500,
    handleBox.y + handleBox.height / 2,
    {
      steps: 10,
    }
  );
  await page.mouse.up();

  // Width should be at least the minimum (100px by default)
  const finalWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(finalWidth).toBeGreaterThanOrEqual(100);
}

/** Verify aspect ratio is maintained during resize */
export async function testAspectRatioMaintained(component: Locator, page: Page): Promise<void> {
  await insertImageViaSlashCommand(component, page);

  const editor = component.locator(".vizel-editor");
  const image = editor.locator("img.vizel-image");
  const rightHandle = editor.locator("[data-resize-handle='right']");

  // Get initial dimensions
  const initialWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);
  const initialHeight = await image.evaluate((el) => (el as HTMLElement).offsetHeight);
  const initialRatio = initialWidth / initialHeight;

  // Resize
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("Handle bounding box not found");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 100,
    handleBox.y + handleBox.height / 2,
    {
      steps: 5,
    }
  );
  await page.mouse.up();

  // Get new dimensions
  const newWidth = await image.evaluate((el) => (el as HTMLElement).offsetWidth);
  const newHeight = await image.evaluate((el) => (el as HTMLElement).offsetHeight);
  const newRatio = newWidth / newHeight;

  // Aspect ratio should be approximately maintained (within 5% tolerance)
  expect(newRatio).toBeCloseTo(initialRatio, 1);
}
