import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

const BLOCK_MENU_SELECTOR = "[data-vizel-block-menu]";
const DRAG_HANDLE_SELECTOR = ".vizel-drag-handle";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve the block menu element. The menu mounts only after the drag handle is
// clicked, so poll until it appears.
async function resolveBlockMenu(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(BLOCK_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(BLOCK_MENU_SELECTOR);
  if (el === null) throw new Error("expected a [data-vizel-block-menu] element");
  return el;
}

// Find a block-menu item by its visible label. The block menu renders each
// action label inside `.vizel-block-menu-item-label`, so match on text content.
function findMenuItemByLabel(root: HTMLElement, label: string): HTMLElement {
  const item = Array.from(root.querySelectorAll<HTMLElement>(".vizel-block-menu-item-label")).find(
    (el) => el.textContent?.includes(label)
  );
  if (item === undefined) throw new Error(`expected a block-menu item labelled "${label}"`);
  return item;
}

/**
 * Type content, then open the block menu via the drag handle.
 *
 * The Tiptap DragHandle plugin reveals the handle through its ProseMirror
 * `handleDOMEvents.mousemove` listener: the listener reads the pointer
 * coordinates, finds the block under them, and (on the next animation frame)
 * positions the handle and clears its `visibility: hidden`. The Playwright
 * original drove this with a real hover; in Vitest Browser Mode a synthetic
 * `mousemove` carrying the paragraph's center coordinates triggers the same
 * detection deterministically, regardless of where the contended browser places
 * the pointer.
 *
 * Once the handle is visible, the handle's own `mousedown` / `mouseup` listeners
 * dispatch the block-menu open event when the pair carries no intervening
 * movement (a click, not a drag). The scenario dispatches that exact pair on the
 * handle element, which avoids racing floating-ui positioning against
 * `userEvent.click`'s in-viewport visibility precondition.
 */
async function openBlockMenu(editorEl: HTMLElement): Promise<void> {
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Test paragraph");

  const paragraph = editorEl.querySelector<HTMLElement>("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  const rect = paragraph.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  editorEl.dispatchEvent(
    new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: x, clientY: y })
  );

  // The plugin toggles `is-visible` and clears the inline `visibility:hidden`
  // once it detects the hovered node on the following animation frame.
  await expect
    .poll(
      () =>
        document
          .querySelector<HTMLElement>(DRAG_HANDLE_SELECTOR)
          ?.classList.contains("is-visible") ?? false,
      { timeout: 5_000 }
    )
    .toBe(true);
  const dragHandle = document.querySelector<HTMLElement>(DRAG_HANDLE_SELECTOR);
  if (dragHandle === null) throw new Error("expected a .vizel-drag-handle element");

  const handleRect = dragHandle.getBoundingClientRect();
  const handleX = handleRect.left + handleRect.width / 2;
  const handleY = handleRect.top + handleRect.height / 2;
  dragHandle.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: handleX,
      clientY: handleY,
    })
  );
  dragHandle.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: handleX,
      clientY: handleY,
    })
  );
}

// Wait until the block menu is gone from the DOM. The menu unmounts on close
// (React/Vue/Svelte return null), so poll the selector rather than asserting
// visibility on a detached locator.
async function waitForBlockMenuGone(): Promise<void> {
  await expect
    .poll(() => document.querySelector(BLOCK_MENU_SELECTOR), { timeout: 5_000 })
    .toBeNull();
}

/** Verify the block menu appears when the drag handle is clicked. */
export const testBlockMenuOpensOnClick: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();
};

/** Verify the block menu carries the menu role and at least one menuitem. */
export const testBlockMenuAccessibility: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();
  expect(blockMenu.getAttribute("role")).toBe("menu");
  expect(blockMenu.querySelectorAll("[role='menuitem']").length).toBeGreaterThan(0);
};

/** Verify the block menu exposes Delete, Duplicate, Copy, Cut, and Turn into. */
export const testBlockMenuDefaultActions: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  for (const label of ["Delete", "Duplicate", "Copy", "Cut", "Turn into"]) {
    const item = findMenuItemByLabel(blockMenu, label);
    await expect.element(page.elementLocator(item)).toBeVisible();
  }
};

/** Verify the block menu closes when Escape is pressed. */
export const testBlockMenuClosesOnEscape: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  await userEvent.keyboard("{Escape}");
  await waitForBlockMenuGone();
};

/** Verify the block menu closes on an outside click. */
export const testBlockMenuClosesOnOutsideClick: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  // The popover controller dismisses on a pointerdown outside the menu body.
  // The Playwright original clicked an empty corner of the page; dispatching a
  // pointerdown on the document body reproduces the same outside-pointer path.
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
  await waitForBlockMenuGone();
};

/** Verify the Delete action removes the block. */
export const testBlockMenuDeleteAction: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  const deleteItem = findMenuItemByLabel(blockMenu, "Delete");
  await userEvent.click(page.elementLocator(deleteItem));

  await waitForBlockMenuGone();
  await expect
    .poll(() => editorEl.textContent?.includes("Test paragraph") ?? false, { timeout: 5_000 })
    .toBe(false);
};

/** Verify the Duplicate action copies the block. */
export const testBlockMenuDuplicateAction: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  const duplicateItem = findMenuItemByLabel(blockMenu, "Duplicate");
  await userEvent.click(page.elementLocator(duplicateItem));

  await waitForBlockMenuGone();
  await expect
    .poll(
      () =>
        Array.from(editorEl.querySelectorAll("p")).filter((p) =>
          p.textContent?.includes("Test paragraph")
        ).length,
      { timeout: 5_000 }
    )
    .toBe(2);
};

/** Verify hovering the Turn into trigger reveals the submenu with options. */
export const testBlockMenuTurnIntoSubmenu: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  const trigger = blockMenu.querySelector<HTMLElement>(".vizel-block-menu-submenu-trigger");
  if (trigger === null) throw new Error("expected a .vizel-block-menu-submenu-trigger element");
  await userEvent.hover(page.elementLocator(trigger));

  await expect
    .poll(() => blockMenu.querySelector(".vizel-block-menu-submenu"), { timeout: 5_000 })
    .not.toBeNull();
  const submenu = blockMenu.querySelector<HTMLElement>(".vizel-block-menu-submenu");
  if (submenu === null) throw new Error("expected a .vizel-block-menu-submenu element");
  await expect.element(page.elementLocator(submenu)).toBeVisible();
  expect(submenu.querySelectorAll("[role='menuitem']").length).toBeGreaterThan(0);
};

/** Verify selecting "Heading 1" from the Turn into submenu converts the block. */
export const testBlockMenuTurnIntoHeading: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await openBlockMenu(editorEl);

  const blockMenu = await resolveBlockMenu();
  await expect.element(page.elementLocator(blockMenu)).toBeVisible();

  const trigger = blockMenu.querySelector<HTMLElement>(".vizel-block-menu-submenu-trigger");
  if (trigger === null) throw new Error("expected a .vizel-block-menu-submenu-trigger element");
  await userEvent.hover(page.elementLocator(trigger));

  await expect
    .poll(() => blockMenu.querySelector(".vizel-block-menu-submenu"), { timeout: 5_000 })
    .not.toBeNull();
  const submenu = blockMenu.querySelector<HTMLElement>(".vizel-block-menu-submenu");
  if (submenu === null) throw new Error("expected a .vizel-block-menu-submenu element");

  const heading1 = findMenuItemByLabel(submenu, "Heading 1");
  await userEvent.click(page.elementLocator(heading1));

  await waitForBlockMenuGone();
  await expect
    .poll(() => editorEl.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Test paragraph");
};
