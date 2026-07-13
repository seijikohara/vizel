import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the slash menu.
 *
 * The slash menu renders as a popup appended to document.body rather than
 * inside the editor component tree, so all menu queries target document
 * directly rather than a fixture-scoped locator.
 */

const SLASH_MENU = "[data-vizel-slash-menu]";
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

// Open the slash menu by clicking the editor and typing "/".
async function openSlashMenu(): Promise<void> {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/");
  // The slash menu renders to document.body asynchronously; poll until visible.
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
}

/** Verify the slash menu appears when typing "/". */
export const testSlashMenuAppears: VizelBcScenario = async () => {
  await openSlashMenu();
  const menu = document.querySelector<HTMLElement>(SLASH_MENU);
  if (menu === null) throw new Error("expected a [data-vizel-slash-menu] element");
  await expect.element(page.elementLocator(menu)).toBeVisible();
};

/** Verify the slash menu hides when deleting the "/" character with Backspace. */
export const testSlashMenuEscape: VizelBcScenario = async () => {
  await openSlashMenu();
  const menu = document.querySelector<HTMLElement>(SLASH_MENU);
  if (menu === null) throw new Error("expected a [data-vizel-slash-menu] element");
  await expect.element(page.elementLocator(menu)).toBeVisible();

  // Pressing Backspace deletes the "/" that triggered the menu; the menu closes.
  await userEvent.keyboard("{Backspace}");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).toBeNull();
};

/** Verify the slash menu filters items when additional characters are typed. */
export const testSlashMenuFiltering: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/head");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  // At least one menu item matching "Heading" must be visible after filtering.
  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).some((item) => item.textContent?.includes("Heading"));
      },
      { timeout: 5_000 }
    )
    .toBe(true);
};

/** Verify clicking "Heading 1" in the slash menu inserts an H1 block. */
export const testSlashMenuHeading: VizelBcScenario = async () => {
  await openSlashMenu();

  // Find and click the "Heading 1" menu item.
  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).find((item) => item.textContent?.includes("Heading 1")) ?? null;
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const headingItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Heading 1"));
  if (headingItem === undefined) throw new Error('expected a "Heading 1" slash menu item');
  await userEvent.click(page.elementLocator(headingItem));

  // The menu closes and an H1 appears in the editor.
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => el.querySelector("h1"), { timeout: 5_000 }).not.toBeNull();

  // Type content into the new heading block.
  await userEvent.click(page.elementLocator(el));
  await userEvent.keyboard("My Heading");
  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("My Heading");
};

/**
 * Verify typing "/bullet" and pressing Enter inserts a bullet list.
 *
 * The first Enter key selects the highlighted menu item and converts the
 * current paragraph to a bullet-list node.
 */
export const testSlashMenuBulletList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/bullet");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");

  // Type content to confirm the bullet list is active.
  await userEvent.keyboard("List item");
  await expect.poll(() => el.querySelector("ul"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify typing "/numbered" and pressing Enter inserts an ordered list.
 *
 * The keyword "numbered" matches the "Numbered List" (ol) item in the menu.
 */
export const testSlashMenuOrderedList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/numbered");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");

  await userEvent.keyboard("List item");
  await expect.poll(() => el.querySelector("ol"), { timeout: 5_000 }).not.toBeNull();
};

/** Verify typing "/task" and pressing Enter inserts a task list with a checkbox. */
export const testSlashMenuTaskList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/task");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");

  await expect.poll(() => el.querySelector(".vizel-task-list"), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("My task");

  const taskItem = el.querySelector<HTMLElement>(".vizel-task-item");
  if (taskItem === null) throw new Error("expected a .vizel-task-item element");
  const checkbox = taskItem.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (checkbox === null) throw new Error("expected a task-item checkbox");
  await expect.element(page.elementLocator(checkbox)).toBeVisible();
};

/** Verify typing "/code" and pressing Enter inserts a code block. */
export const testSlashMenuCodeBlock: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/code");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");

  await userEvent.keyboard("const x = 1;");
  await expect.poll(() => el.querySelector("pre"), { timeout: 5_000 }).not.toBeNull();
};

/** Verify typing "/quote" and pressing Enter inserts a blockquote. */
export const testSlashMenuBlockquote: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/quote");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");

  await userEvent.keyboard("A wise quote");
  await expect.poll(() => el.querySelector("blockquote"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify keyboard navigation moves the selection indicator inside the menu.
 *
 * Two ArrowDown keypresses advance the selection; `data-selected="true"` marks
 * the active item.
 */
export const testSlashMenuKeyboardNavigation: VizelBcScenario = async () => {
  await openSlashMenu();

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");

  await expect
    .poll(() => document.querySelector("[data-selected='true']"), { timeout: 5_000 })
    .not.toBeNull();
  const selectedItem = document.querySelector<HTMLElement>("[data-selected='true']");
  if (selectedItem === null) throw new Error("expected a [data-selected='true'] element");
  await expect.element(page.elementLocator(selectedItem)).toBeVisible();
};

/** Verify the empty state element appears when no items match the filter. */
export const testSlashMenuEmptyState: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/xyznonexistent");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  const emptyState = document.querySelector<HTMLElement>("[data-vizel-slash-menu-empty]");
  if (emptyState === null) {
    throw new Error("expected a [data-vizel-slash-menu-empty] element");
  }
  await expect.element(page.elementLocator(emptyState)).toBeVisible();
};

/**
 * Verify group headers are displayed and the "Text" group header is visible.
 *
 * The slash menu groups items under labelled section headers.
 */
export const testSlashMenuGroupHeaders: VizelBcScenario = async () => {
  await openSlashMenu();

  await expect
    .poll(() => document.querySelector<HTMLElement>(".vizel-slash-menu-group-header"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const firstHeader = document.querySelector<HTMLElement>(".vizel-slash-menu-group-header");
  if (firstHeader === null) throw new Error("expected a .vizel-slash-menu-group-header element");
  await expect.element(page.elementLocator(firstHeader)).toBeVisible();

  // The "Text" group header must be present in the initial unfiltered list.
  const textHeader = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-group-header")
  ).find((el) => el.textContent?.includes("Text"));
  if (textHeader === undefined) throw new Error('expected a group header containing "Text"');
  await expect.element(page.elementLocator(textHeader)).toBeVisible();
};

/**
 * Verify the "Heading 1" item displays its keyboard shortcut hint.
 *
 * Each item that has an associated shortcut renders a `.vizel-slash-menu-shortcut`
 * child element.
 */
export const testSlashMenuShortcuts: VizelBcScenario = async () => {
  await openSlashMenu();

  // Wait for menu items to render.
  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).find((item) => item.textContent?.includes("Heading 1")) ?? null;
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const headingItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Heading 1"));
  if (headingItem === undefined) throw new Error('expected a "Heading 1" slash menu item');
  await expect.element(page.elementLocator(headingItem)).toBeVisible();

  const shortcut = headingItem.querySelector<HTMLElement>(".vizel-slash-menu-shortcut");
  if (shortcut === null) throw new Error("expected a .vizel-slash-menu-shortcut inside Heading 1");
  await expect.element(page.elementLocator(shortcut)).toBeVisible();
};

/**
 * Verify the Tab key moves the selection to the first item of the next group.
 *
 * On initial open the first item (in the Text group) is selected. Tab advances
 * to the first item of the Lists group ("Bullet List").
 */
export const testSlashMenuTabNavigation: VizelBcScenario = async () => {
  await openSlashMenu();

  // The first item must be selected and must be a heading.
  await expect
    .poll(() => document.querySelector("[data-selected='true']"), { timeout: 5_000 })
    .not.toBeNull();
  const firstSelected = document.querySelector<HTMLElement>("[data-selected='true']");
  if (firstSelected === null) throw new Error("expected a [data-selected='true'] element");
  await expect.element(page.elementLocator(firstSelected)).toBeVisible();
  expect(firstSelected.textContent ?? "").toMatch(/Heading/);

  // Tab advances the selection to the first item of the next group.
  await userEvent.keyboard("{Tab}");

  await expect
    .poll(
      () => {
        const sel = document.querySelector<HTMLElement>("[data-selected='true']");
        return sel?.textContent?.includes("Bullet List") ?? false;
      },
      { timeout: 5_000 }
    )
    .toBe(true);
  const nextSelected = document.querySelector<HTMLElement>("[data-selected='true']");
  if (nextSelected === null) throw new Error("expected a [data-selected='true'] element after Tab");
  await expect.element(page.elementLocator(nextSelected)).toBeVisible();
  expect(nextSelected.textContent ?? "").toContain("Bullet List");
};

/**
 * Verify keyword search finds an item whose keyword matches the query.
 *
 * Typing "/checkbox" should surface the "Task List" item because "checkbox"
 * is registered as a keyword for that block type.
 */
export const testSlashMenuKeywordSearch: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/checkbox");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).some((item) => item.textContent?.includes("Task List"));
      },
      { timeout: 5_000 }
    )
    .toBe(true);
  const taskItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Task List"));
  if (taskItem === undefined) throw new Error('expected a "Task List" slash menu item');
  await expect.element(page.elementLocator(taskItem)).toBeVisible();
};

/**
 * Verify partial-string fuzzy matching surfaces the correct item.
 *
 * Typing "/bul" must still find "Bullet List" even though the query does not
 * include the full item title.
 */
export const testSlashMenuFuzzySearch: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/bul");
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();

  await expect
    .poll(
      () => {
        const items = document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).some((item) => item.textContent?.includes("Bullet List"));
      },
      { timeout: 5_000 }
    )
    .toBe(true);
  const bulletItem = Array.from(
    document.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Bullet List"));
  if (bulletItem === undefined) throw new Error('expected a "Bullet List" slash menu item');
  await expect.element(page.elementLocator(bulletItem)).toBeVisible();
};
