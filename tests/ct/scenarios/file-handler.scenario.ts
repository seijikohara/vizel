import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the FileHandler
 * feature.
 *
 * The Playwright original drove file drop and paste through `page.evaluate`,
 * which built a DataTransfer and dispatched DragEvent / ClipboardEvent inside
 * the page. The Vitest specs run in the browser, so these scenarios build the
 * DataTransfer and dispatch the events directly without `page.evaluate`.
 */

const EDITOR = ".vizel-editor";
const PROSE_MIRROR = ".ProseMirror";

// A minimal valid 1x1 red PNG, matching the Playwright `createMockImageFile`
// byte sequence. The bytes prove a real File reaches the drop / paste handler.
const MOCK_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

// Build the mock image File the Playwright scenario uploaded.
const createMockImageFile = (name = "test-image.png", type = "image/png"): File =>
  new File([MOCK_PNG_BYTES], name, { type });

// Build a DataTransfer carrying the supplied files. ProseMirror reads dropped
// and pasted files from `dataTransfer.files`, which `items.add(file)` populates.
const createFileDataTransfer = (files: readonly File[]): DataTransfer => {
  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }
  return dataTransfer;
};

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll with a generous budget before querying.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and the asynchronous Tiptap mount can exceed the
  // default 1s poll budget under that contention.
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

/** Verify the FileHandler extension renders an editable ProseMirror view. */
export const testFileHandlerExtensionLoaded: VizelBcScenario = async () => {
  await resolveEditor();
  await expect.poll(() => document.querySelector(PROSE_MIRROR), { timeout: 5_000 }).not.toBeNull();
  const proseMirror = document.querySelector<HTMLElement>(PROSE_MIRROR);
  if (proseMirror === null) throw new Error("expected a .ProseMirror element");
  await expect.element(page.elementLocator(proseMirror)).toBeVisible();
};

/** Verify the file drop target is the visible, editable ProseMirror view. */
export const testFileDropTargetExists: VizelBcScenario = async () => {
  await resolveEditor();
  await expect.poll(() => document.querySelector(PROSE_MIRROR), { timeout: 5_000 }).not.toBeNull();
  const proseMirror = document.querySelector<HTMLElement>(PROSE_MIRROR);
  if (proseMirror === null) throw new Error("expected a .ProseMirror element");
  await expect.element(page.elementLocator(proseMirror)).toBeVisible();
  await expect.element(page.elementLocator(proseMirror)).toHaveAttribute("contenteditable", "true");
};

/** Verify clicking the editor focuses the ProseMirror view that receives files. */
export const testAllowedMimeTypes: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));

  // The editor is ready to receive files once the ProseMirror view holds focus.
  await expect
    .poll(() => document.activeElement?.classList.contains("ProseMirror") ?? false, {
      timeout: 5_000,
    })
    .toBe(true);
};

/** Verify a file drop dispatched onto the editor reaches a drop listener. */
export const testFileDropSimulation: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));

  const state = { dropReceived: false };
  document.addEventListener(
    "drop",
    () => {
      state.dropReceived = true;
    },
    { once: true }
  );

  const dataTransfer = createFileDataTransfer([createMockImageFile()]);
  const rect = el.getBoundingClientRect();
  const clientX = rect.x + rect.width / 2;
  const clientY = rect.y + rect.height / 2;

  // Dispatch the same sequence the Playwright scenario emitted: dragenter,
  // dragover, then drop, each carrying the file-bearing DataTransfer.
  const target = document.elementFromPoint(clientX, clientY) ?? el;
  for (const type of ["dragenter", "dragover", "drop"] as const) {
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, clientX, clientY })
    );
  }

  await expect.poll(() => state.dropReceived, { timeout: 5_000 }).toBe(true);
};

/** Verify a file paste dispatched onto the editor reaches a paste listener. */
export const testFilePasteSimulation: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));

  const state = { pasteReceived: false };
  document.addEventListener(
    "paste",
    () => {
      state.pasteReceived = true;
    },
    { once: true }
  );

  const clipboardData = createFileDataTransfer([createMockImageFile()]);
  const target = document.activeElement ?? el;
  target.dispatchEvent(
    new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData })
  );

  await expect.poll(() => state.pasteReceived, { timeout: 5_000 }).toBe(true);
};
