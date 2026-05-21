import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared scenarios for the `VizelMinimap` component.
 *
 * The minimap reduces the editor's document to a colored-rectangle
 * canvas. We can't compare pixels in a portable way across browsers, so
 * the scenarios assert structural invariants: the canvas mounts at the
 * requested dimensions, the rendered pixels differ from an empty canvas
 * after the editor receives content, and pointer interaction does not
 * throw.
 */

/**
 * Mount the fixture, type several paragraphs into the editor, and
 * verify the minimap canvas contains non-empty pixel content (i.e. its
 * `toDataURL()` differs from a freshly-cleared canvas of the same
 * dimensions).
 */
export async function testMinimapRendersBlocks(component: Locator, page: Page): Promise<void> {
  const canvas = component.locator(".vizel-minimap");
  await expect(canvas).toBeVisible();

  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Third paragraph");

  // Give the requestAnimationFrame loop a chance to paint.
  await page.waitForTimeout(50);

  const pixelInfo = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const dataUrl = c.toDataURL();
    const blank = document.createElement("canvas");
    blank.width = c.width;
    blank.height = c.height;
    return { dataUrl, blank: blank.toDataURL(), width: c.width, height: c.height };
  });

  expect(pixelInfo.width).toBeGreaterThan(0);
  expect(pixelInfo.height).toBeGreaterThan(0);
  expect(pixelInfo.dataUrl).not.toEqual(pixelInfo.blank);
}

/**
 * Verify that pointer-down on the minimap focuses the editor (the
 * underlying call is `editor.commands.focus(pos)`). The test only
 * asserts no exception bubbles up; precise block targeting depends on
 * deterministic layout that varies across browsers.
 */
export async function testMinimapPointerFocusesEditor(
  component: Locator,
  page: Page
): Promise<void> {
  const canvas = component.locator(".vizel-minimap");
  await expect(canvas).toBeVisible();

  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Paragraph A");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraph B");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraph C");

  await page.waitForTimeout(50);

  // Click near the bottom of the minimap; the focus call should not
  // throw and the editor should retain focus.
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Minimap canvas has no bounding box");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 5);

  await expect(editor).toBeFocused();
}
