import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the Image feature.
 *
 * The slash menu renders to document.body, so all menu queries target the
 * document directly rather than a fixture-scoped locator.
 *
 * The image insertion path calls window.prompt to ask for a URL. The scenarios
 * replace window.prompt with a stub before triggering the slash command,
 * restoring the original afterwards so tests do not leak state.
 */

const SLASH_MENU = "[data-vizel-slash-menu]";
const EDITOR = ".vizel-editor";

const TEST_IMAGE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23ccc' width='200' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ETest%3C/text%3E%3C/svg%3E";

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

// Insert an image via the slash command. The helper stubs window.prompt so the
// URL dialog resolves instantly without blocking the browser event loop.
async function insertImageViaSlashCommand(): Promise<void> {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Replace window.prompt before opening the slash menu so the stub is in
  // place when the Image command invokes it.
  const originalPrompt = window.prompt;
  window.prompt = () => TEST_IMAGE_URL;

  try {
    await userEvent.keyboard("/");
    await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

    // Find the "Image (from URL)" item by its description text, which uniquely
    // distinguishes it from "Upload Image".
    await expect
      .poll(
        () => {
          const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
          return (
            Array.from(items).find((item) =>
              item.textContent?.includes("Insert an image from URL")
            ) ?? null
          );
        },
        { timeout: 5_000 }
      )
      .not.toBeNull();

    const imageItem = Array.from(
      document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
    ).find((item) => item.textContent?.includes("Insert an image from URL"));
    if (imageItem === undefined) throw new Error("expected an image slash menu item");
    await userEvent.click(page.elementLocator(imageItem));

    // Wait for the slash menu to close after the command runs.
    await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).toBeNull();
  } finally {
    window.prompt = originalPrompt;
  }
}

/** Verify an image can be inserted via the slash command. */
export const testImageInsertViaSlashCommand: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();

  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");
  await expect.element(page.elementLocator(img)).toBeVisible();
  expect(img.getAttribute("src")).toBe(TEST_IMAGE_URL);
};

/** Verify the image element carries the correct CSS class after insertion. */
export const testImageRendersWithClass: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();

  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");
  await expect.element(page.elementLocator(img)).toHaveClass("vizel-image");
};

/** Verify clicking the image selects it and adds the ProseMirror selected-node class. */
export const testImageSelection: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();

  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");

  await userEvent.click(page.elementLocator(img));

  // ProseMirror adds `ProseMirror-selectednode` to the resize wrapper when
  // the node receives a NodeSelection.
  await expect
    .poll(() => el.querySelector("[data-resize-wrapper].ProseMirror-selectednode"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const wrapper = el.querySelector<HTMLElement>("[data-resize-wrapper].ProseMirror-selectednode");
  if (wrapper === null) throw new Error("expected a selected resize wrapper");
  await expect.element(page.elementLocator(wrapper)).toBeVisible();
};

/** Verify pressing Backspace on a selected image removes the image from the document. */
export const testImageDeleteWithBackspace: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();

  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");

  await userEvent.click(page.elementLocator(img));
  await userEvent.keyboard("{Backspace}");

  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).toBeNull();
};

/** Verify pressing Delete on a selected image removes the image from the document. */
export const testImageDeleteWithDelete: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();

  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");

  await userEvent.click(page.elementLocator(img));
  await userEvent.keyboard("{Delete}");

  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).toBeNull();
};

/**
 * Verify the "Image (from URL)" item is visible in the slash menu when typing "/".
 *
 * The item is identified by its description text "Insert an image from URL",
 * which uniquely distinguishes it from "Upload Image".
 */
export const testImageInSlashMenu: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/");

  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return (
          Array.from(items).find((item) =>
            item.textContent?.includes("Insert an image from URL")
          ) ?? null
        );
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const imageItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Insert an image from URL"));
  if (imageItem === undefined) throw new Error("expected an image slash menu item");
  await expect.element(page.elementLocator(imageItem)).toBeVisible();
};

/**
 * Verify the "Upload Image" item is visible in the slash menu when typing "/upload".
 *
 * The filtered query narrows the menu to items matching the "upload" keyword.
 */
export const testUploadImageInSlashMenu: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/upload");

  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).find((item) => item.textContent?.includes("Upload Image")) ?? null;
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const uploadItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Upload Image"));
  if (uploadItem === undefined) throw new Error("expected an upload image slash menu item");
  await expect.element(page.elementLocator(uploadItem)).toBeVisible();
};
