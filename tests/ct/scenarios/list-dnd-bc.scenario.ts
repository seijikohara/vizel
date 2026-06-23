import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for list item keyboard
 * navigation and reordering.
 *
 * Every reorder and indent flow is keyboard-driven (Tab, Shift+Tab,
 * Alt+ArrowUp), so the port replaces Playwright key presses with userEvent
 * keyboard input rather than HTML5 drag-and-drop.
 */

const EDITOR = ".vizel-editor";

// Resolve the editor contenteditable root. Tiptap mounts asynchronously, so
// poll until the element appears rather than querying once.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and the asynchronous Tiptap mount can exceed the
  // default 1s poll budget under that contention.
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Create a two-item task list via the slash menu. The "/task" filter selects the
// "Task List" item, and Enter converts the current paragraph to a task list.
async function createTwoTaskItems(el: HTMLElement, editor: ReturnType<typeof page.elementLocator>) {
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
}

/** Verify Tab indents a bullet list item (sinks it). */
export const testBulletListTabIndent: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  // Tab sinks the second item into the first, producing a nested list.
  await userEvent.keyboard("{Tab}");

  await expect.poll(() => el.querySelector("ul ul"), { timeout: 5_000 }).not.toBeNull();
  const nestedList = el.querySelector<HTMLElement>("ul ul");
  if (nestedList === null) throw new Error("expected a nested ul ul element");
  await expect.element(page.elementLocator(nestedList)).toBeVisible();
  expect(nestedList.querySelector("li")?.textContent ?? "").toContain("Second item");
};

/** Verify Shift+Tab outdents a bullet list item (lifts it). */
export const testBulletListShiftTabOutdent: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  // Sink the second item first, then confirm the nested list exists.
  await userEvent.keyboard("{Tab}");
  await expect.poll(() => el.querySelector("ul ul"), { timeout: 5_000 }).not.toBeNull();

  // Shift+Tab lifts the second item back to the top level.
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

  await expect.poll(() => el.querySelectorAll(":scope > ul > li").length).toBe(2);
  const topLevelItems = el.querySelectorAll<HTMLElement>(":scope > ul > li");
  expect(topLevelItems[1]?.textContent ?? "").toContain("Second item");
};

/** Verify Tab indents a task list item (sinks it). */
export const testTaskListTabIndent: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await createTwoTaskItems(el, editor);

  // Cursor is in the second task; Tab sinks it into the first.
  await userEvent.keyboard("{Tab}");

  const nestedSelector = "ul[data-type='taskList'] ul[data-type='taskList']";
  await expect.poll(() => el.querySelector(nestedSelector), { timeout: 5_000 }).not.toBeNull();
  const nestedTaskList = el.querySelector<HTMLElement>(nestedSelector);
  if (nestedTaskList === null) throw new Error("expected a nested task list");
  await expect.element(page.elementLocator(nestedTaskList)).toBeVisible();
  expect(nestedTaskList.querySelector("li")?.textContent ?? "").toContain("Task two");
};

/** Verify Shift+Tab outdents a task list item (lifts it). */
export const testTaskListShiftTabOutdent: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await createTwoTaskItems(el, editor);

  const nestedSelector = "ul[data-type='taskList'] ul[data-type='taskList']";
  await userEvent.keyboard("{Tab}");
  await expect.poll(() => el.querySelector(nestedSelector), { timeout: 5_000 }).not.toBeNull();

  // Shift+Tab lifts the second task back to the top level.
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");

  await expect
    .poll(() => el.querySelectorAll(":scope > ul[data-type='taskList'] > li").length)
    .toBe(2);
  const topLevelTasks = el.querySelectorAll<HTMLElement>(":scope > ul[data-type='taskList'] > li");
  expect(topLevelTasks[1]?.textContent ?? "").toContain("Task two");
};

/** Verify Alt+Up reorders bullet list items. */
export const testBulletListAltArrowReorder: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "- Apple");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Banana");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Cherry");

  // Cursor is in "Cherry" (third item); Alt+ArrowUp moves it above "Banana".
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => Array.from(el.querySelectorAll("ul li")).map((item) => item.textContent ?? ""), {
      timeout: 5_000,
    })
    .toEqual(["Apple", "Cherry", "Banana"]);

  // Move "Cherry" up again to the first position.
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => Array.from(el.querySelectorAll("ul li")).map((item) => item.textContent ?? ""), {
      timeout: 5_000,
    })
    .toEqual(["Cherry", "Apple", "Banana"]);
};

/** Verify ordered list items reorder with Alt+Up. */
export const testOrderedListAltArrowReorder: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  await userEvent.type(editor, "1. First");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second");

  // Cursor is in "Second"; Alt+ArrowUp moves it above "First".
  await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

  await expect
    .poll(() => Array.from(el.querySelectorAll("ol li")).map((item) => item.textContent ?? ""), {
      timeout: 5_000,
    })
    .toEqual(["Second", "First"]);
};
