import { expect } from "vitest";

import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears. `.vizel-editor`
// is queried by class because it is a div, not an ARIA textbox.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and under that contention the asynchronous Tiptap
  // mount can exceed the default 1s poll budget before the editor view appears.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

/**
 * Verify the outline renders one entry per heading in the document.
 *
 * The `[data-vizel-outline]` nav mounts empty at first (zero height), so assert
 * the structural attribute before typing rather than `toBeVisible`. Visibility is
 * checked after headings have been entered and the outline has children.
 */
export const testOutlineRendersHeadings: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  const outlineEl = document.querySelector<HTMLElement>("[data-vizel-outline]");
  if (outlineEl === null) throw new Error("expected a [data-vizel-outline] element");

  // The outline nav mounts as empty; check the structural attribute first.
  // An empty `<nav>` collapses to zero height which registers as "hidden",
  // so defer `toBeVisible` until the outline actually has children.
  expect(outlineEl.getAttribute("role")).toBe("tree");

  // Type the three headings.
  await userEvent.click(editor);
  await userEvent.type(editor, "# A");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "## B");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "## C");

  // Three outline entries become visible.
  await expect.element(page.elementLocator(outlineEl)).toBeVisible();
  await expect
    .poll(() => outlineEl.querySelectorAll('[role="treeitem"]').length, { timeout: 5_000 })
    .toBe(3);

  const items = outlineEl.querySelectorAll<HTMLElement>('[role="treeitem"]');
  await expect.element(page.elementLocator(items[0])).toHaveTextContent("A");
  await expect.element(page.elementLocator(items[1])).toHaveTextContent("B");
  await expect.element(page.elementLocator(items[2])).toHaveTextContent("C");
};

/**
 * Verify clicking an outline entry moves the editor selection to that heading.
 *
 * After typing three headings the cursor is at the end of the document. Moving
 * to the document start records an initial cursor position. Clicking the third
 * outline entry jumps the selection forward, so the reported position changes.
 */
export const testOutlineClickMovesSelection: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  const outlineEl = document.querySelector<HTMLElement>("[data-vizel-outline]");
  if (outlineEl === null) throw new Error("expected a [data-vizel-outline] element");

  const cursorPosEl = document.querySelector<HTMLElement>("[data-testid='cursor-pos']");
  if (cursorPosEl === null) throw new Error("expected a [data-testid='cursor-pos'] element");

  await userEvent.click(editor);
  await userEvent.type(editor, "# A");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "## B");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "## C");

  // Move the cursor back to the start so the initial position is recorded.
  await pressKeyChord("Mod", "Home");

  const initial = cursorPosEl.textContent;

  // Wait for the outline items to be populated before clicking.
  await expect
    .poll(() => outlineEl.querySelectorAll('[role="treeitem"]').length, { timeout: 5_000 })
    .toBe(3);

  // Click the "C" entry's button to navigate to that heading.
  const thirdItem = outlineEl.querySelectorAll<HTMLElement>('[role="treeitem"]')[2];
  if (thirdItem === undefined) throw new Error("expected a third treeitem");
  const button = thirdItem.querySelector<HTMLElement>("button");
  if (button === null) throw new Error("expected a button inside the third treeitem");
  await userEvent.click(page.elementLocator(button));

  // Selection moved past the initial position.
  await expect.element(page.elementLocator(cursorPosEl)).not.toHaveTextContent(initial ?? "");
};
