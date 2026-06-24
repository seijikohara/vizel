import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for image resize.
 *
 * The resize handles use native DOM mouse events: a `mousedown` on a handle
 * registers `mousemove` / `mouseup` listeners on `document`. Playwright drove
 * this with `page.mouse`; in the browser the scenarios dispatch `MouseEvent`s
 * with explicit `clientX` coordinates so the same handlers fire.
 *
 * Image insertion goes through the slash command, which calls `window.prompt`
 * for the URL. The scenarios stub `window.prompt` before triggering the command
 * and restore it afterwards so tests do not leak state.
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

// Insert an image via the slash command, then return the live img element. The
// helper stubs window.prompt so the URL dialog resolves instantly without
// blocking the browser event loop.
async function insertImageViaSlashCommand(): Promise<HTMLImageElement> {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  const originalPrompt = window.prompt;
  window.prompt = () => TEST_IMAGE_URL;

  try {
    await userEvent.keyboard("/");
    await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

    // Find the "Image (from URL)" item by its description text, which uniquely
    // distinguishes it from "Upload Image".
    await expect
      .poll(
        () =>
          Array.from(document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")).find(
            (item) => item.textContent?.includes("Insert an image from URL")
          ) ?? null,
        { timeout: 5_000 }
      )
      .not.toBeNull();

    const imageItem = Array.from(
      document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
    ).find((item) => item.textContent?.includes("Insert an image from URL"));
    if (imageItem === undefined) throw new Error("expected an image slash menu item");
    await userEvent.click(page.elementLocator(imageItem));

    await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).toBeNull();
  } finally {
    window.prompt = originalPrompt;
  }

  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const img = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (img === null) throw new Error("expected an img.vizel-image element");
  return img;
}

// Drive a handle drag by dispatching the native mouse events the resize NodeView
// listens for. `mousedown` fires on the handle; `mousemove` / `mouseup` fire on
// `document`, matching the listener targets the extension registers. `deltaX`
// shifts the pointer along the X axis from the handle centre.
function dragHandle(handle: HTMLElement, deltaX: number, options?: { release?: boolean }): void {
  const box = handle.getBoundingClientRect();
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  handle.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: startX, clientY: y })
  );
  document.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: startX + deltaX,
      clientY: y,
    })
  );
  if (options?.release !== false) {
    document.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: startX + deltaX,
        clientY: y,
      })
    );
  }
}

function requireHandle(el: HTMLElement, side: "left" | "right"): HTMLElement {
  const handle = el.querySelector<HTMLElement>(`[data-resize-handle='${side}']`);
  if (handle === null) throw new Error(`expected a ${side} resize handle`);
  return handle;
}

/** Verify the resize wrapper is rendered around the image. */
export const testResizeWrapperRendered: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();
  const el = await resolveEditor();
  await expect
    .poll(() => el.querySelector("[data-resize-wrapper]"), { timeout: 5_000 })
    .not.toBeNull();
  const wrapper = el.querySelector<HTMLElement>("[data-resize-wrapper]");
  if (wrapper === null) throw new Error("expected a resize wrapper");
  await expect.element(page.elementLocator(wrapper)).toBeVisible();
};

/** Verify the left resize handle exists. */
export const testLeftResizeHandleExists: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();
  const el = await resolveEditor();
  await expect
    .poll(() => el.querySelector("[data-resize-handle='left']"), { timeout: 5_000 })
    .not.toBeNull();
};

/** Verify the right resize handle exists. */
export const testRightResizeHandleExists: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();
  const el = await resolveEditor();
  await expect
    .poll(() => el.querySelector("[data-resize-handle='right']"), { timeout: 5_000 })
    .not.toBeNull();
};

/** Verify dragging the right handle outward increases the image width. */
export const testResizeWithRightHandle: VizelBcScenario = async () => {
  const img = await insertImageViaSlashCommand();
  const el = await resolveEditor();
  const rightHandle = requireHandle(el, "right");

  const initialWidth = img.offsetWidth;
  dragHandle(rightHandle, 50);

  await expect.poll(() => img.offsetWidth, { timeout: 5_000 }).toBeGreaterThan(initialWidth);
};

/** Verify dragging the left handle outward increases the image width. */
export const testResizeWithLeftHandle: VizelBcScenario = async () => {
  const img = await insertImageViaSlashCommand();
  const el = await resolveEditor();
  const leftHandle = requireHandle(el, "left");

  const initialWidth = img.offsetWidth;
  // The left handle grows the image when dragged toward negative X.
  dragHandle(leftHandle, -50);

  await expect.poll(() => img.offsetWidth, { timeout: 5_000 }).toBeGreaterThan(initialWidth);
};

/** Verify the dimension tooltip shows during a drag and hides on release. */
export const testResizeTooltipAppears: VizelBcScenario = async () => {
  await insertImageViaSlashCommand();
  const el = await resolveEditor();
  const rightHandle = requireHandle(el, "right");
  const tooltip = el.querySelector<HTMLElement>("[data-resize-tooltip]");
  if (tooltip === null) throw new Error("expected a resize tooltip");

  // Hold the drag open so the tooltip stays visible during the assertions.
  dragHandle(rightHandle, 20, { release: false });

  await expect.poll(() => getComputedStyle(tooltip).display, { timeout: 5_000 }).toBe("block");
  // The tooltip text follows the format "NNN × NNN".
  await expect.poll(() => tooltip.textContent ?? "", { timeout: 5_000 }).toMatch(/\d+ × \d+/);

  document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));

  await expect.poll(() => getComputedStyle(tooltip).display, { timeout: 5_000 }).toBe("none");
};

/** Verify the minimum-width constraint keeps the image at or above 100px. */
export const testMinWidthConstraint: VizelBcScenario = async () => {
  const img = await insertImageViaSlashCommand();
  const el = await resolveEditor();
  const leftHandle = requireHandle(el, "left");

  // Drag the left handle far to the right to try to shrink below the minimum.
  dragHandle(leftHandle, 500);

  await expect.poll(() => img.offsetWidth, { timeout: 5_000 }).toBeGreaterThanOrEqual(100);
};

/** Verify the aspect ratio is approximately maintained during a resize. */
export const testAspectRatioMaintained: VizelBcScenario = async () => {
  const img = await insertImageViaSlashCommand();
  const el = await resolveEditor();
  const rightHandle = requireHandle(el, "right");

  const initialRatio = img.offsetWidth / img.offsetHeight;
  dragHandle(rightHandle, 100);

  await expect.poll(() => img.offsetWidth, { timeout: 5_000 }).toBeGreaterThan(200);
  const newRatio = img.offsetWidth / img.offsetHeight;
  // The ratio should hold within roughly one decimal place of tolerance.
  expect(newRatio).toBeCloseTo(initialRatio, 1);
};
