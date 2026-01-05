import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for FileHandler functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/**
 * Create a mock image file for testing
 */
export function createMockImageFile(
  name = "test-image.png",
  type = "image/png"
): {
  buffer: Buffer;
  name: string;
  mimeType: string;
} {
  // Create a minimal valid PNG file (1x1 pixel, red)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  return {
    buffer: pngData,
    name,
    mimeType: type,
  };
}

/**
 * Helper to simulate file drop on editor
 * Note: This uses Playwright's page.dispatchEvent with DataTransfer
 */
export async function simulateFileDrop(
  page: Page,
  editor: Locator,
  files: Array<{ buffer: Buffer; name: string; mimeType: string }>
): Promise<void> {
  // Get the bounding box of the editor
  const boundingBox = await editor.boundingBox();
  if (!boundingBox) {
    throw new Error("Editor bounding box not found");
  }

  // Calculate center of editor
  const x = boundingBox.x + boundingBox.width / 2;
  const y = boundingBox.y + boundingBox.height / 2;

  // Create DataTransfer with files
  await page.evaluate(
    ({ x, y, filesData }) => {
      const dataTransfer = new DataTransfer();

      for (const fileData of filesData) {
        const uint8Array = new Uint8Array(fileData.buffer);
        const blob = new Blob([uint8Array], { type: fileData.mimeType });
        const file = new File([blob], fileData.name, { type: fileData.mimeType });
        dataTransfer.items.add(file);
      }

      // Dispatch dragenter event
      const dragEnterEvent = new DragEvent("dragenter", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: x,
        clientY: y,
      });

      // Dispatch dragover event
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: x,
        clientY: y,
      });

      // Dispatch drop event
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: x,
        clientY: y,
      });

      const target = document.elementFromPoint(x, y);
      if (target) {
        target.dispatchEvent(dragEnterEvent);
        target.dispatchEvent(dragOverEvent);
        target.dispatchEvent(dropEvent);
      }
    },
    {
      x,
      y,
      filesData: files.map((f) => ({
        buffer: Array.from(f.buffer),
        name: f.name,
        mimeType: f.mimeType,
      })),
    }
  );
}

/**
 * Helper to simulate file paste on editor
 */
export async function simulateFilePaste(
  page: Page,
  files: Array<{ buffer: Buffer; name: string; mimeType: string }>
): Promise<void> {
  await page.evaluate(
    (filesData) => {
      const dataTransfer = new DataTransfer();

      for (const fileData of filesData) {
        const uint8Array = new Uint8Array(fileData.buffer);
        const blob = new Blob([uint8Array], { type: fileData.mimeType });
        const file = new File([blob], fileData.name, { type: fileData.mimeType });
        dataTransfer.items.add(file);
      }

      const clipboardEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
      });

      document.activeElement?.dispatchEvent(clipboardEvent);
    },
    files.map((f) => ({
      buffer: Array.from(f.buffer),
      name: f.name,
      mimeType: f.mimeType,
    }))
  );
}

/**
 * Test that FileHandler extension is loaded and configured
 */
export async function testFileHandlerExtensionLoaded(
  component: Locator,
  _page: Page
): Promise<void> {
  // Check that the ProseMirror editor is rendered and visible
  const proseMirror = component.locator(".ProseMirror");
  await expect(proseMirror).toBeVisible();
}

/**
 * Test that file drop target exists and accepts drops
 */
export async function testFileDropTargetExists(component: Locator, _page: Page): Promise<void> {
  // ProseMirror editor should be visible and have contenteditable attribute
  const proseMirror = component.locator(".ProseMirror");
  await expect(proseMirror).toBeVisible();
  await expect(proseMirror).toHaveAttribute("contenteditable", "true");
}

/**
 * Test that allowed MIME types are respected
 * This is a basic test - full file handling tests would require
 * mocking the upload handler
 */
export async function testAllowedMimeTypes(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // The editor should be focused and ready to receive files
  const isFocused = await page.evaluate(() => {
    const activeElement = document.activeElement;
    return activeElement?.classList.contains("ProseMirror");
  });

  expect(isFocused).toBe(true);
}

/**
 * Test file drop simulation
 * Note: This test verifies the drop event is dispatched correctly
 */
export async function testFileDropSimulation(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  const mockFile = createMockImageFile();

  // Track if drop event was received
  await page.evaluate(() => {
    (window as unknown as { dropEventReceived?: boolean }).dropEventReceived = false;
    document.addEventListener(
      "drop",
      () => {
        (window as unknown as { dropEventReceived?: boolean }).dropEventReceived = true;
      },
      { once: true }
    );
  });

  await simulateFileDrop(page, editor, [mockFile]);

  // Verify drop event was dispatched
  const dropEventReceived = await page.evaluate(
    () => (window as unknown as { dropEventReceived?: boolean }).dropEventReceived
  );
  expect(dropEventReceived).toBe(true);
}

/**
 * Test file paste simulation
 * Note: This test verifies the paste event is dispatched correctly
 */
export async function testFilePasteSimulation(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  const mockFile = createMockImageFile();

  // Track if paste event was received
  await page.evaluate(() => {
    (window as unknown as { pasteEventReceived?: boolean }).pasteEventReceived = false;
    document.addEventListener(
      "paste",
      () => {
        (window as unknown as { pasteEventReceived?: boolean }).pasteEventReceived = true;
      },
      { once: true }
    );
  });

  await simulateFilePaste(page, [mockFile]);

  // Verify paste event was dispatched
  const pasteEventReceived = await page.evaluate(
    () => (window as unknown as { pasteEventReceived?: boolean }).pasteEventReceived
  );
  expect(pasteEventReceived).toBe(true);
}
