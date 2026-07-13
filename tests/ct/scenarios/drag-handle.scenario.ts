import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the drag handle.
 *
 * The visibility and accessibility flows drive the Tiptap DragHandle plugin's
 * hover detection through `userEvent.hover`. The block-reorder flows split into
 * two groups: keyboard moves (Alt+ArrowUp / Alt+ArrowDown) port directly to
 * `userEvent.keyboard`, while the drag-and-drop reorder flows replicate the
 * native HTML5 drag sequence the Tiptap handle dispatches by building a
 * DataTransfer and firing dragstart / dragover / drop DOM events directly in
 * the browser (the Playwright original used `dragHandle.dragTo`).
 */

const EDITOR = ".vizel-editor";
const DRAG_HANDLE = ".vizel-drag-handle";

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

// Hover the given block so the DragHandle plugin detects the node, then resolve
// the now-visible handle. The plugin reveals the handle on hover over a block;
// `userEvent.hover` fires the pointer events the plugin's node detection reads.
async function revealDragHandle(block: HTMLElement): Promise<HTMLElement> {
  await userEvent.hover(page.elementLocator(block));
  await expect.poll(() => document.querySelector(DRAG_HANDLE), { timeout: 5_000 }).not.toBeNull();
  const handle = document.querySelector<HTMLElement>(DRAG_HANDLE);
  if (handle === null) throw new Error("expected a .vizel-drag-handle element");
  return handle;
}

/**
 * Drag the visible handle for `sourceRow` onto the top of `targetRow`.
 *
 * The Playwright original used `dragHandle.dragTo(target, { targetPosition })`,
 * which Playwright implements as a synthetic HTML5 drag sequence. In the browser
 * the scenario builds one DataTransfer and dispatches dragstart on the handle,
 * then dragover and drop on the target row near its top so ProseMirror inserts
 * the dragged block before the target. The shared DataTransfer carries the
 * payload ProseMirror's drag plugin sets during dragstart through to the drop.
 */
async function dragHandleToRow(sourceRow: HTMLElement, targetRow: HTMLElement): Promise<void> {
  const handle = await revealDragHandle(sourceRow);
  const targetBox = targetRow.getBoundingClientRect();
  const dropX = targetBox.left + 20;
  const dropY = targetBox.top + 2;
  const dataTransfer = new DataTransfer();

  handle.dispatchEvent(
    new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer })
  );
  targetRow.dispatchEvent(
    new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: dropX,
      clientY: dropY,
    })
  );
  targetRow.dispatchEvent(
    new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: dropX,
      clientY: dropY,
    })
  );
  handle.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer }));
}

// Read the trimmed text of each matched element. The reorder assertions compare
// the resulting document order against the expected sequence.
const textsOf = (root: HTMLElement, selector: string): string[] =>
  Array.from(root.querySelectorAll(selector)).map((el) => (el.textContent ?? "").trim());

/** Verify the drag handle is rendered when hovering over a block. */
export const testDragHandleVisibleOnHover: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "First paragraph");

  const paragraph = el.querySelector<HTMLElement>("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  const handle = await revealDragHandle(paragraph);
  await expect.element(page.elementLocator(handle)).toBeVisible();
};

/** Verify a block moves up with Alt+ArrowUp. */
export const testMoveBlockUpWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "First paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second paragraph");

  // The cursor is in the second paragraph; Alt+ArrowUp moves it above the first.
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => textsOf(el, "p"), { timeout: 5_000 })
    .toEqual(["Second paragraph", "First paragraph"]);
};

/** Verify a block moves down with Alt+ArrowDown. */
export const testMoveBlockDownWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "First paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second paragraph");

  // Move the cursor up to the first paragraph, then move that block down.
  await userEvent.keyboard("{ArrowUp}");
  await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

  await expect
    .poll(() => textsOf(el, "p"), { timeout: 5_000 })
    .toEqual(["Second paragraph", "First paragraph"]);
};

/** Verify a heading block moves with the keyboard. */
export const testMoveHeadingWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "# Heading");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Paragraph content");

  // The cursor is in the paragraph; Alt+ArrowUp moves it above the heading.
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => el.children[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Paragraph content");
  await expect.poll(() => el.querySelector("h1")?.textContent ?? "").toContain("Heading");
};

/** Verify the drag handle exposes the documented accessibility attributes. */
export const testDragHandleAccessibility: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Test paragraph");

  const paragraph = el.querySelector<HTMLElement>("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  const handle = await revealDragHandle(paragraph);
  await expect.element(page.elementLocator(handle)).toBeVisible();

  expect(handle.getAttribute("role")).toBe("button");
  expect(handle.getAttribute("aria-label")).toBe("Drag to reorder block, click for menu");
  expect(handle.getAttribute("draggable")).toBe("true");
};

/** Verify the drag handle stays visible after a click. */
export const testDragHandleIsClickable: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Test paragraph");

  const paragraph = el.querySelector<HTMLElement>("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  const handle = await revealDragHandle(paragraph);
  await expect.element(page.elementLocator(handle)).toBeVisible();

  // The handle click must not error and the handle stays present afterwards.
  await userEvent.click(page.elementLocator(handle));
  await expect.element(page.elementLocator(handle)).toBeVisible();
};

/** Verify a list item moves up with Alt+ArrowUp. */
export const testMoveListItemUpWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  // The cursor is in the second item; Alt+ArrowUp moves it above the first.
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => textsOf(el, "ul li"), { timeout: 5_000 })
    .toEqual(["Second item", "First item"]);
};

/** Verify a list item moves down with Alt+ArrowDown. */
export const testMoveListItemDownWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  // Move the cursor up to the first item, then move that item down.
  await userEvent.keyboard("{ArrowUp}");
  await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

  await expect
    .poll(() => textsOf(el, "ul li"), { timeout: 5_000 })
    .toEqual(["Second item", "First item"]);
};

/** Verify a task item moves with the keyboard. */
export const testMoveTaskItemWithKeyboard: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Build a task list via the slash command, then add a second task.
  await userEvent.keyboard("/task");
  await expect
    .poll(() => document.querySelector("[data-vizel-slash-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => el.querySelector(".vizel-task-list"), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("Task one");
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("Task two");

  // The cursor is in the second task; Alt+ArrowUp moves it above the first.
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => textsOf(el, "ul[data-type='taskList'] li"), { timeout: 5_000 })
    .toEqual(["Task two", "Task one"]);
};

/** Verify a bullet list item reorders via drag-and-drop. */
export const testDragBulletListItemReorder: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Third item");

  await expect.poll(() => el.querySelectorAll("ul li").length, { timeout: 5_000 }).toBe(3);
  const items = el.querySelectorAll<HTMLElement>("ul li");
  const second = items[1];
  const first = items[0];
  if (second === undefined || first === undefined) throw new Error("expected three bullet items");

  // Drag the second item above the first.
  await dragHandleToRow(second, first);

  await expect
    .poll(() => textsOf(el, "ul li"), { timeout: 5_000 })
    .toEqual(["Second item", "First item", "Third item"]);
};

/** Verify an ordered list item reorders and numbering follows the DOM order. */
export const testDragOrderedListItemReorder: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "1. First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Third item");

  await expect.poll(() => el.querySelector("ol"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelectorAll("ol li").length, { timeout: 5_000 }).toBe(3);
  const items = el.querySelectorAll<HTMLElement>("ol li");
  const third = items[2];
  const first = items[0];
  if (third === undefined || first === undefined) throw new Error("expected three ordered items");

  // Drag the third item above the first.
  await dragHandleToRow(third, first);

  await expect
    .poll(() => textsOf(el, "ol li"), { timeout: 5_000 })
    .toEqual(["Third item", "First item", "Second item"]);
};

/** Verify a task item reorders while preserving its checked state. */
export const testDragTaskItemPreservesCheckState: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.keyboard("/task");
  await expect
    .poll(() => document.querySelector("[data-vizel-slash-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => el.querySelector(".vizel-task-list"), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("Task one");
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("Task two");
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("Task three");

  const taskSelector = "ul[data-type='taskList'] li";
  await expect.poll(() => el.querySelectorAll(taskSelector).length, { timeout: 5_000 }).toBe(3);

  // Check the second task before reordering.
  const beforeItems = el.querySelectorAll<HTMLElement>(taskSelector);
  const secondItem = beforeItems[1];
  const firstItem = beforeItems[0];
  if (secondItem === undefined || firstItem === undefined) throw new Error("expected three tasks");
  const secondCheckbox = secondItem.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (secondCheckbox === null) throw new Error("expected a checkbox in the second task");
  await userEvent.click(page.elementLocator(secondCheckbox));
  await expect.element(page.elementLocator(secondCheckbox)).toBeChecked();

  // Drag the checked second task above the first.
  await dragHandleToRow(secondItem, firstItem);

  await expect
    .poll(() => textsOf(el, taskSelector)[0] ?? "", { timeout: 5_000 })
    .toContain("Task two");
  const movedFirst = el.querySelectorAll<HTMLElement>(taskSelector)[0];
  if (movedFirst === undefined) throw new Error("expected a first task after reorder");
  const movedCheckbox = movedFirst.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (movedCheckbox === null) throw new Error("expected a checkbox in the moved task");
  await expect.element(page.elementLocator(movedCheckbox)).toBeChecked();
  await expect.poll(() => textsOf(el, taskSelector)[1] ?? "").toContain("Task one");
};

/** Verify a nested list item reorders within its parent item. */
export const testDragNestedListItemReorder: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Build: Parent / Child A (indented) / Child B (indented) / Child C (indented).
  await userEvent.type(editor, "- Parent");
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("{Tab}");
  await userEvent.type(editor, "Child A");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Child B");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Child C");

  const nestedSelector = "ul li ul li";
  await expect.poll(() => el.querySelectorAll(nestedSelector).length, { timeout: 5_000 }).toBe(3);
  const items = el.querySelectorAll<HTMLElement>(nestedSelector);
  const childB = items[1];
  const childA = items[0];
  if (childB === undefined || childA === undefined) throw new Error("expected three nested items");

  // Drag "Child B" above "Child A".
  await dragHandleToRow(childB, childA);

  await expect
    .poll(() => textsOf(el, nestedSelector), { timeout: 5_000 })
    .toEqual(["Child B", "Child A", "Child C"]);
};

/** Verify the drag handle appears on hover and stays hidden otherwise. */
export const testDragHandleHoverBehavior: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Test paragraph");

  // Move the pointer to the document corner so no block is hovered. The plugin
  // removes the `is-visible` class, dropping the handle to its base opacity.
  await userEvent.hover(page.elementLocator(document.documentElement));
  await expect
    .poll(
      () => {
        const handle = document.querySelector<HTMLElement>(DRAG_HANDLE);
        return handle === null ? 0 : Number.parseFloat(getComputedStyle(handle).opacity);
      },
      { timeout: 5_000 }
    )
    .toBeLessThan(1);

  // Hover the paragraph; the plugin reveals the handle at full opacity.
  const paragraph = el.querySelector<HTMLElement>("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  const handle = await revealDragHandle(paragraph);
  await expect.element(page.elementLocator(handle)).toBeVisible();
  await expect
    .poll(() => Number.parseFloat(getComputedStyle(handle).opacity), { timeout: 5_000 })
    .toBeGreaterThan(0.9);
};
