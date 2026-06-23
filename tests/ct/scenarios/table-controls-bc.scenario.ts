import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for table controls.
 *
 * The controls rely on real pointer geometry. The wrapper reveals its overlay
 * buttons and handles through a CSS `:hover` rule, so the scenarios trigger
 * `userEvent.hover` to surface them. The handle position and the row / column
 * the controls act on are computed inside a `mousemove` handler that reads
 * `event.clientX` / `event.clientY` against the cell rectangles, so the
 * scenarios dispatch a `mousemove` carrying explicit coordinates over the
 * target cell. The row / column menus open on the handle `mousedown`, which
 * `userEvent.click` produces, and each menu renders to `document.body`.
 *
 * Opacity assertions read `getComputedStyle` through the CSS opacity transition,
 * so the scenarios poll until the value settles rather than reading once.
 */

const EDITOR = ".vizel-editor";
const TABLE_WRAPPER = ".vizel-table-controls-wrapper";
const TABLE = ".vizel-table";
const COLUMN_INSERT = ".vizel-table-column-insert";
const ROW_INSERT = ".vizel-table-row-insert";
const ROW_HANDLE = ".vizel-table-row-handle";
const COLUMN_HANDLE = ".vizel-table-column-handle";
const TABLE_MENU = ".vizel-table-menu";

// Resolve the editor contenteditable root. Tiptap mounts asynchronously, so
// poll with a generous budget before querying. The full three-browser matrix
// runs nine browser instances in parallel and the async mount can exceed the
// default 1s poll budget under that contention.
async function resolveEditor(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

const requireElement = <T extends HTMLElement>(selector: string, root: ParentNode): T => {
  const el = root.querySelector<T>(selector);
  if (el === null) throw new Error(`expected a ${selector} element`);
  return el;
};

// Insert a default 3x3 table via the slash command, then wait until the table
// wrapper and its cells render.
async function insertTable(): Promise<HTMLElement> {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));
  await userEvent.keyboard("/table");
  await expect
    .poll(() => document.querySelector("[data-vizel-slash-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  await userEvent.keyboard("{Enter}");

  await expect.poll(() => el.querySelector(TABLE_WRAPPER), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelectorAll(`${TABLE} th`).length, { timeout: 5_000 }).toBe(3);
  return el;
}

// Poll an element's computed opacity until it matches the expected value. The
// controls fade through a CSS opacity transition, so a single read can catch an
// intermediate value.
async function expectOpacity(el: HTMLElement, expected: string): Promise<void> {
  await expect.poll(() => getComputedStyle(el).opacity, { timeout: 5_000 }).toBe(expected);
}

// Place the editor cursor in a cell by dispatching native mouse events at the
// cell centre. `userEvent.click` re-resolves a cell locator by ARIA role and
// accessible name, which is ambiguous once a cell holds text; the native events
// reach ProseMirror's click handler directly and set the selection.
function clickCell(cell: HTMLElement): void {
  const rect = cell.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  for (const type of ["mousedown", "mouseup", "click"] as const) {
    cell.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX, clientY })
    );
  }
}

const dispatchMove = (wrapper: HTMLElement, cell: HTMLElement): void => {
  const rect = cell.getBoundingClientRect();
  wrapper.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    })
  );
};

// Record the hovered row / column and position the handles by dispatching a
// `mousemove` over a cell; the handler reads `clientX` / `clientY` against the
// cell rectangle. The handler throttles to one move per 16ms, and the preceding
// `userEvent.hover` fires its own move at the wrapper centre, so dispatch twice
// across the throttle window to guarantee the cell-centred move is processed.
async function moveOverCell(wrapper: HTMLElement, cell: HTMLElement): Promise<void> {
  dispatchMove(wrapper, cell);
  await new Promise((resolve) => setTimeout(resolve, 20));
  dispatchMove(wrapper, cell);
}

// Reveal the row handle for the first body cell and click it to open the row
// menu. The hover surfaces the handle via CSS, the `mousemove` sets the hovered
// row, and the click opens the menu on the handle `mousedown`.
async function openRowMenu(wrapper: HTMLElement, cell: HTMLElement): Promise<HTMLElement> {
  clickCell(cell);
  await userEvent.hover(page.elementLocator(wrapper));
  await moveOverCell(wrapper, cell);
  const rowHandle = requireElement<HTMLElement>(ROW_HANDLE, wrapper);
  await expectOpacity(rowHandle, "1");
  await userEvent.click(page.elementLocator(rowHandle));
  await expect.poll(() => document.querySelector(TABLE_MENU), { timeout: 5_000 }).not.toBeNull();
  return requireElement<HTMLElement>(TABLE_MENU, document);
}

// Reveal the column handle for the given column and click it to open the column
// menu.
async function openColumnMenu(
  wrapper: HTMLElement,
  table: HTMLElement,
  columnIndex: number
): Promise<HTMLElement> {
  const targetCell = table.querySelectorAll<HTMLElement>("th")[columnIndex];
  if (targetCell === undefined) throw new Error(`expected a header cell at index ${columnIndex}`);
  clickCell(targetCell);
  await userEvent.hover(page.elementLocator(wrapper));
  await moveOverCell(wrapper, targetCell);
  const columnHandle = requireElement<HTMLElement>(COLUMN_HANDLE, wrapper);
  await expectOpacity(columnHandle, "1");
  await userEvent.click(page.elementLocator(columnHandle));
  await expect.poll(() => document.querySelector(TABLE_MENU), { timeout: 5_000 }).not.toBeNull();
  return requireElement<HTMLElement>(TABLE_MENU, document);
}

// Find a menu item by its visible text and click it.
const clickMenuItem = async (menu: HTMLElement, text: string): Promise<void> => {
  const item = Array.from(menu.querySelectorAll<HTMLElement>("*")).find(
    (node) => node.textContent?.trim() === text
  );
  if (item === undefined) throw new Error(`expected a menu item with text "${text}"`);
  await userEvent.click(page.elementLocator(item));
};

// Read the live computed `text-align` of the nth cell of the given tag.
// `setNodeMarkup` replaces the cell DOM node, so a held reference goes stale;
// re-query the cell on every read.
const cellTextAlign = (table: HTMLElement, tag: "th" | "td", index: number): string => {
  const cell = table.querySelectorAll<HTMLElement>(tag)[index];
  return cell === undefined ? "" : getComputedStyle(cell).textAlign;
};

const expectMenuHasText = (menu: HTMLElement, text: string): void => {
  const found = Array.from(menu.querySelectorAll<HTMLElement>("*")).some(
    (node) => node.textContent?.trim() === text
  );
  expect(found, `menu contains "${text}"`).toBe(true);
};

/** Verify the table wrapper renders with the default 3x3 structure. */
export const testTableRendersWithControls: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  await expect.element(page.elementLocator(wrapper)).toBeVisible();

  const table = requireElement<HTMLElement>(TABLE, wrapper);
  await expect.element(page.elementLocator(table)).toBeVisible();
  expect(table.querySelectorAll("th").length).toBe(3);
  expect(table.querySelectorAll("td").length).toBe(6);
};

/** Verify the column insert button is hidden until the wrapper is hovered. */
export const testColumnInsertButtonAppearsOnHover: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const columnInsertBtn = requireElement<HTMLElement>(COLUMN_INSERT, wrapper);

  await expectOpacity(columnInsertBtn, "0");
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(columnInsertBtn, "1");
};

/** Verify clicking the column insert button adds a column. */
export const testColumnInsertButtonAddsColumn: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  const columnInsertBtn = requireElement<HTMLElement>(COLUMN_INSERT, wrapper);

  await userEvent.click(page.elementLocator(requireElement<HTMLElement>("th", table)));
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(columnInsertBtn, "1");
  await userEvent.click(page.elementLocator(columnInsertBtn));

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(4);
};

/** Verify the row insert button is hidden until the wrapper is hovered. */
export const testRowInsertButtonAppearsOnHover: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const rowInsertBtn = requireElement<HTMLElement>(ROW_INSERT, wrapper);

  await expectOpacity(rowInsertBtn, "0");
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(rowInsertBtn, "1");
};

/** Verify clicking the row insert button adds a row. */
export const testRowInsertButtonAddsRow: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  const rowInsertBtn = requireElement<HTMLElement>(ROW_INSERT, wrapper);

  expect(table.querySelectorAll("tr").length).toBe(3);
  await userEvent.click(page.elementLocator(requireElement<HTMLElement>("td", table)));
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(rowInsertBtn, "1");
  await userEvent.click(page.elementLocator(rowInsertBtn));

  await expect.poll(() => table.querySelectorAll("tr").length, { timeout: 5_000 }).toBe(4);
};

/** Verify the row handle is hidden until the wrapper is hovered. */
export const testRowHandleAppearsOnCellHover: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const rowHandle = requireElement<HTMLElement>(ROW_HANDLE, wrapper);

  await expectOpacity(rowHandle, "0");
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(rowHandle, "1");
};

/** Verify clicking the row handle opens the row menu. */
export const testRowHandleOpensMenu: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  await expect.element(page.elementLocator(menu)).toBeVisible();
};

/** Verify the column handle is hidden until the wrapper is hovered. */
export const testColumnHandleAppearsOnCellHover: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const columnHandle = requireElement<HTMLElement>(COLUMN_HANDLE, wrapper);

  await expectOpacity(columnHandle, "0");
  await userEvent.hover(page.elementLocator(wrapper));
  await expectOpacity(columnHandle, "1");
};

/** Verify clicking the column handle opens the column menu. */
export const testColumnHandleOpensMenu: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openColumnMenu(wrapper, table, 0);
  await expect.element(page.elementLocator(menu)).toBeVisible();
};

/** Verify the row menu lists the expected row actions. */
export const testMenuContainsExpectedItems: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  expectMenuHasText(menu, "Add row above");
  expectMenuHasText(menu, "Add row below");
  expectMenuHasText(menu, "Delete row");
  expectMenuHasText(menu, "Toggle header row");
  expectMenuHasText(menu, "Delete table");
};

/** Verify the row menu "Add row below" action appends a row. */
export const testMenuAddRowAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  const initialRows = table.querySelectorAll("tr").length;

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  await clickMenuItem(menu, "Add row below");

  await expect
    .poll(() => table.querySelectorAll("tr").length, { timeout: 5_000 })
    .toBe(initialRows + 1);
  await expect.poll(() => document.querySelector(TABLE_MENU), { timeout: 5_000 }).toBeNull();
};

/** Verify the row menu "Delete row" action removes a row. */
export const testMenuDeleteRowAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  expect(table.querySelectorAll("tr").length).toBe(3);

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  await clickMenuItem(menu, "Delete row");

  await expect.poll(() => table.querySelectorAll("tr").length, { timeout: 5_000 }).toBe(2);
};

/** Verify the row menu "Delete table" action removes the table. */
export const testMenuDeleteTableAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  await clickMenuItem(menu, "Delete table");

  await expect.poll(() => el.querySelector(TABLE_WRAPPER), { timeout: 5_000 }).toBeNull();
};

/** Verify the row menu closes when the Escape key is pressed. */
export const testMenuClosesOnEscape: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));
  await userEvent.keyboard("{Escape}");

  await expect.poll(() => document.querySelector(TABLE_MENU), { timeout: 5_000 }).toBeNull();
};

/** Verify the row menu closes when a click lands outside it. */
export const testMenuClosesOnClickOutside: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  await openRowMenu(wrapper, requireElement<HTMLElement>("td", table));

  // The click-outside handler registers via setTimeout, so the first click may
  // race ahead of the listener. Retry the click until the menu closes.
  await expect
    .poll(
      async () => {
        await userEvent.click(page.elementLocator(document.body));
        return document.querySelector(TABLE_MENU);
      },
      { timeout: 10_000, interval: 300 }
    )
    .toBeNull();
};

/** Verify the column menu lists the expected column actions. */
export const testColumnMenuContainsExpectedItems: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openColumnMenu(wrapper, table, 0);
  expectMenuHasText(menu, "Add column left");
  expectMenuHasText(menu, "Add column right");
  expectMenuHasText(menu, "Delete column");
  expectMenuHasText(menu, "Align left");
  expectMenuHasText(menu, "Align center");
  expectMenuHasText(menu, "Align right");
  expectMenuHasText(menu, "Delete table");
};

/** Verify the column menu "Add column left" action inserts before the column. */
export const testMenuAddColumnLeftAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const firstHeaderCell = requireElement<HTMLElement>("th", table);
  await userEvent.click(page.elementLocator(firstHeaderCell));
  await userEvent.keyboard("First");
  expect(table.querySelectorAll("th").length).toBe(3);

  const menu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(menu, "Add column left");

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(4);
  const secondHeaderCell = table.querySelectorAll<HTMLElement>("th")[1];
  await expect
    .poll(() => secondHeaderCell?.textContent ?? "", { timeout: 5_000 })
    .toContain("First");
};

/** Verify the column menu "Add column right" action inserts after the column. */
export const testMenuAddColumnRightAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const firstHeaderCell = requireElement<HTMLElement>("th", table);
  await userEvent.click(page.elementLocator(firstHeaderCell));
  await userEvent.keyboard("First");
  expect(table.querySelectorAll("th").length).toBe(3);

  const menu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(menu, "Add column right");

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(4);
  await expect
    .poll(() => table.querySelector("th")?.textContent ?? "", { timeout: 5_000 })
    .toContain("First");
};

/** Verify the column menu "Delete column" action removes a column. */
export const testMenuDeleteColumnAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  expect(table.querySelectorAll("th").length).toBe(3);

  const menu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(menu, "Delete column");

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(2);
};

/** Verify the row menu "Add row above" action inserts before the row. */
export const testMenuAddRowAboveAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const firstBodyCell = requireElement<HTMLElement>("td", table);
  await userEvent.click(page.elementLocator(firstBodyCell));
  await userEvent.keyboard("Original");
  expect(table.querySelectorAll("tr").length).toBe(3);

  const menu = await openRowMenu(wrapper, firstBodyCell);
  await clickMenuItem(menu, "Add row above");

  await expect.poll(() => table.querySelectorAll("tr").length, { timeout: 5_000 }).toBe(4);
  await expect
    .poll(() => table.querySelectorAll("tr")[2]?.querySelector("td")?.textContent ?? "", {
      timeout: 5_000,
    })
    .toContain("Original");
};

/** Verify the row menu "Toggle header row" action converts the header row. */
export const testMenuToggleHeaderRowAction: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);
  expect(table.querySelectorAll("th").length).toBe(3);

  const menu = await openRowMenu(wrapper, requireElement<HTMLElement>("th", table));
  await clickMenuItem(menu, "Toggle header row");

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => table.querySelectorAll("td").length, { timeout: 5_000 }).toBe(9);
};

/** Verify the column menu "Align center" action centres the whole column. */
export const testTextAlignmentViaMenu: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const secondHeaderCell = table.querySelectorAll<HTMLElement>("th")[1];
  if (secondHeaderCell === undefined) throw new Error("expected a second header cell");
  await userEvent.click(page.elementLocator(secondHeaderCell));
  await userEvent.keyboard("Header");

  const secondBodyCell = table.querySelectorAll<HTMLElement>("td")[1];
  if (secondBodyCell === undefined) throw new Error("expected a second body cell");
  await userEvent.click(page.elementLocator(secondBodyCell));
  await userEvent.keyboard("Content");

  const menu = await openColumnMenu(wrapper, table, 1);
  await clickMenuItem(menu, "Align center");

  await expect.poll(() => cellTextAlign(table, "th", 1), { timeout: 5_000 }).toBe("center");
  await expect.poll(() => cellTextAlign(table, "td", 1), { timeout: 5_000 }).toBe("center");

  // Other columns stay left-aligned (alignment is column-scoped).
  expect(cellTextAlign(table, "th", 0)).not.toBe("center");
  expect(cellTextAlign(table, "td", 0)).not.toBe("center");
};

/** Verify switching column alignment from center back to left. */
export const testTextAlignmentLeftViaMenu: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const centerMenu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(centerMenu, "Align center");
  await expect.poll(() => cellTextAlign(table, "th", 0), { timeout: 5_000 }).toBe("center");

  const leftMenu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(leftMenu, "Align left");
  await expect.poll(() => cellTextAlign(table, "th", 0), { timeout: 5_000 }).toBe("left");
};

/** Verify the column menu "Align right" action right-aligns the whole column. */
export const testTextAlignmentRightViaMenu: VizelBcScenario = async () => {
  const el = await insertTable();
  const wrapper = requireElement<HTMLElement>(TABLE_WRAPPER, el);
  const table = requireElement<HTMLElement>(TABLE, wrapper);

  const menu = await openColumnMenu(wrapper, table, 0);
  await clickMenuItem(menu, "Align right");

  await expect.poll(() => cellTextAlign(table, "th", 0), { timeout: 5_000 }).toBe("right");
  await expect.poll(() => cellTextAlign(table, "td", 0), { timeout: 5_000 }).toBe("right");
};
