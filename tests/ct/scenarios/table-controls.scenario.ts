import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for table controls functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const TABLE_WRAPPER_SELECTOR = ".vizel-table-controls-wrapper";
const TABLE_SELECTOR = ".vizel-table";
const COLUMN_INSERT_SELECTOR = ".vizel-table-column-insert";
const ROW_INSERT_SELECTOR = ".vizel-table-row-insert";
const ROW_HANDLE_SELECTOR = ".vizel-table-row-handle";
const COLUMN_HANDLE_SELECTOR = ".vizel-table-column-handle";
const TABLE_MENU_SELECTOR = ".vizel-table-menu";

/** Helper to insert a table via slash command */
async function insertTable(page: Page): Promise<void> {
  await page.keyboard.type("/table");
  await page.keyboard.press("Enter");
}

/** Verify table with controls wrapper is rendered */
export async function testTableRendersWithControls(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Insert a table
  await insertTable(page);

  // Verify table wrapper exists
  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  await expect(wrapper).toBeVisible();

  // Verify table exists inside wrapper
  const table = wrapper.locator(TABLE_SELECTOR);
  await expect(table).toBeVisible();

  // Verify default table structure (3x3 with header)
  const headerCells = table.locator("th");
  const bodyCells = table.locator("td");
  await expect(headerCells).toHaveCount(3);
  await expect(bodyCells).toHaveCount(6); // 2 rows x 3 columns
}

/** Verify column insert button appears on hover near column border */
export async function testColumnInsertButtonAppearsOnHover(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);
  const columnInsertBtn = wrapper.locator(COLUMN_INSERT_SELECTOR);

  // Wait for table to be fully rendered with cells
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.locator("th").first()).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Move mouse outside the wrapper to ensure hover state is reset
  await page.mouse.move(0, 0);
  await page.waitForTimeout(50);

  // CSS-based approach: button has opacity: 0 initially, opacity: 1 on hover
  // Initially button should be hidden (opacity: 0)
  await expect(columnInsertBtn).toHaveCSS("opacity", "0");

  // Hover over the wrapper to trigger CSS :hover
  await wrapper.hover();

  // Button should now be visible (opacity: 1)
  await expect(columnInsertBtn).toHaveCSS("opacity", "1");
}

/** Verify clicking column insert button adds a column */
export async function testColumnInsertButtonAddsColumn(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);
  const columnInsertBtn = wrapper.locator(COLUMN_INSERT_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.locator("th").first()).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Get initial column count
  const initialHeaderCells = await table.locator("th").count();
  expect(initialHeaderCells).toBe(3);

  // Click on a cell first to set up editor focus
  const firstHeaderCell = table.locator("th").first();
  await firstHeaderCell.click({ force: true });
  await page.waitForTimeout(100);

  // Hover over wrapper to show button (CSS :hover)
  await wrapper.hover();
  await expect(columnInsertBtn).toHaveCSS("opacity", "1");

  // Click the column insert button
  await columnInsertBtn.click({ force: true });

  // Wait for DOM update
  await page.waitForTimeout(200);

  // Verify column was added
  const newHeaderCells = await table.locator("th").count();
  expect(newHeaderCells).toBe(4);
}

/** Verify row insert button appears on hover near row border */
export async function testRowInsertButtonAppearsOnHover(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);
  const rowInsertBtn = wrapper.locator(ROW_INSERT_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.locator("th").first()).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Move mouse outside the wrapper to ensure hover state is reset
  await page.mouse.move(0, 0);
  await page.waitForTimeout(50);

  // CSS-based approach: button has opacity: 0 initially, opacity: 1 on hover
  // Initially button should be hidden (opacity: 0)
  await expect(rowInsertBtn).toHaveCSS("opacity", "0");

  // Hover over the wrapper to trigger CSS :hover
  await wrapper.hover();

  // Button should now be visible (opacity: 1)
  await expect(rowInsertBtn).toHaveCSS("opacity", "1");
}

/** Verify clicking row insert button adds a row */
export async function testRowInsertButtonAddsRow(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);
  const rowInsertBtn = wrapper.locator(ROW_INSERT_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.locator("th").first()).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Get initial row count (1 header row + 2 body rows = 3 rows)
  const initialRows = await table.locator("tr").count();
  expect(initialRows).toBe(3);

  // Click on a cell first to set up editor focus
  const firstCell = table.locator("td").first();
  await firstCell.click({ force: true });
  await page.waitForTimeout(100);

  // Hover over wrapper to show button (CSS :hover)
  await wrapper.hover();
  await expect(rowInsertBtn).toHaveCSS("opacity", "1");

  // Click the row insert button
  await rowInsertBtn.click({ force: true });

  // Wait for DOM update
  await page.waitForTimeout(200);

  // Verify row was added
  const newRows = await table.locator("tr").count();
  expect(newRows).toBe(4);
}

/** Verify row handle appears on cell hover */
export async function testRowHandleAppearsOnCellHover(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);
  const rowHandle = wrapper.locator(ROW_HANDLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();
  await expect(table.locator("td").first()).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Move mouse outside the wrapper to ensure hover state is reset
  await page.mouse.move(0, 0);
  await page.waitForTimeout(50);

  // CSS-based approach: handle has opacity: 0 initially, opacity: 1 on hover
  // Initially handle should be hidden (opacity: 0)
  await expect(rowHandle).toHaveCSS("opacity", "0");

  // Hover over the wrapper to trigger CSS :hover
  await wrapper.hover();

  // Handle should now be visible (opacity: 1)
  await expect(rowHandle).toHaveCSS("opacity", "1");
}

/** Verify clicking row handle opens menu */
export async function testRowHandleOpensMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Give layout time to stabilize
  await page.waitForTimeout(100);

  // Show row handle and click it
  await showRowHandleAndClick(page);

  // Verify menu appears (menu is rendered to document.body)
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await expect(menu).toBeVisible();
}

/** Helper to show row handle and click it */
async function showRowHandleAndClick(page: Page): Promise<void> {
  const firstCell = page.locator(".vizel-table td").first();
  const rowHandle = page.locator(ROW_HANDLE_SELECTOR);

  // First click on a cell to set up selection
  await firstCell.click({ force: true });
  await page.waitForTimeout(100);

  // Hover over the cell to trigger mousemove (sets currentHoveredRow)
  // This also shows the row handle via CSS :hover on wrapper
  await firstCell.hover();
  await expect(rowHandle).toHaveCSS("opacity", "1");

  // Wait for event handlers to be set up
  await page.waitForTimeout(50);

  // Click the row handle
  await rowHandle.click({ force: true });

  // Wait for menu to render
  await page.waitForTimeout(50);
}

/** Helper to show column handle and click it for a specific column */
async function showColumnHandleAndClick(page: Page, columnIndex: number): Promise<void> {
  const table = page.locator(".vizel-table");
  const columnHandle = page.locator(COLUMN_HANDLE_SELECTOR);

  // Get the cell in the specified column (first row) to determine column position
  const headerCells = table.locator("th");
  const targetCell = headerCells.nth(columnIndex);

  // Click on cell to set up selection
  await targetCell.click({ force: true });
  await page.waitForTimeout(100);

  // Hover over the cell to trigger mousemove (sets currentHoveredColumn)
  await targetCell.hover();
  await expect(columnHandle).toHaveCSS("opacity", "1");

  // Wait for event handlers to be set up
  await page.waitForTimeout(50);

  // Click the column handle
  await columnHandle.click({ force: true });

  // Wait for menu to render
  await page.waitForTimeout(50);
}

/** Verify row menu contains expected items */
export async function testMenuContainsExpectedItems(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Open row menu via row handle
  await showRowHandleAndClick(page);

  // Verify row menu items
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await expect(menu).toBeVisible();

  // Check for row-specific menu items
  await expect(menu.getByText("Add row above")).toBeVisible();
  await expect(menu.getByText("Add row below")).toBeVisible();
  await expect(menu.getByText("Delete row")).toBeVisible();
  await expect(menu.getByText("Toggle header row")).toBeVisible();
  await expect(menu.getByText("Delete table")).toBeVisible();
}

/** Verify menu action adds row */
export async function testMenuAddRowAction(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  const initialRows = await table.locator("tr").count();

  // Open menu
  await showRowHandleAndClick(page);

  // Click "Add row below"
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await menu.getByText("Add row below").click();

  // Verify row was added
  const newRows = await table.locator("tr").count();
  expect(newRows).toBe(initialRows + 1);

  // Menu should be closed
  await expect(menu).not.toBeVisible();
}

/** Verify menu action deletes row */
export async function testMenuDeleteRowAction(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  const initialRows = await table.locator("tr").count();
  expect(initialRows).toBe(3); // 1 header + 2 body

  // Open menu
  await showRowHandleAndClick(page);

  // Click "Delete row"
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await menu.getByText("Delete row").click();

  // Verify row was deleted
  const newRows = await table.locator("tr").count();
  expect(newRows).toBe(initialRows - 1);
}

/** Verify menu action deletes table */
export async function testMenuDeleteTableAction(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Open menu
  await showRowHandleAndClick(page);

  // Click "Delete table"
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await menu.getByText("Delete table").click();

  // Verify table was deleted
  await expect(wrapper).not.toBeVisible();
}

/** Verify menu closes on escape key */
export async function testMenuClosesOnEscape(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Open menu
  await showRowHandleAndClick(page);

  const menu = page.locator(TABLE_MENU_SELECTOR);
  await expect(menu).toBeVisible();

  // Press escape
  await page.keyboard.press("Escape");

  // Menu should be closed
  await expect(menu).not.toBeVisible();
}

/** Verify menu closes on click outside */
export async function testMenuClosesOnClickOutside(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Open menu
  await showRowHandleAndClick(page);

  const menu = page.locator(TABLE_MENU_SELECTOR);
  await expect(menu).toBeVisible();

  // Wait for click outside handler to be registered (setTimeout in createTableMenu)
  await page.waitForTimeout(50);

  // Click outside the menu - use a position far from the menu
  // Get page dimensions and click in an empty area
  const viewport = page.viewportSize();
  const clickX = viewport ? viewport.width - 10 : 700;
  const clickY = viewport ? viewport.height - 10 : 500;
  await page.mouse.click(clickX, clickY);

  // Menu should be closed
  await expect(menu).not.toBeVisible();
}

/** Verify text alignment via column handle menu (Markdown compatible - column-wide) */
export async function testTextAlignmentViaMenu(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await insertTable(page);

  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  const table = wrapper.locator(TABLE_SELECTOR);

  // Wait for table to be fully rendered
  await expect(wrapper).toBeVisible();
  await expect(table).toBeVisible();

  // Type some content in the second column
  const secondHeaderCell = table.locator("th").nth(1);
  await secondHeaderCell.click({ force: true });
  await page.keyboard.type("Header");

  const secondBodyCell = table.locator("td").nth(1);
  await secondBodyCell.click({ force: true });
  await page.keyboard.type("Content");

  // Open column handle menu for the second column (index 1)
  await showColumnHandleAndClick(page, 1);

  // Click "Align center"
  const menu = page.locator(TABLE_MENU_SELECTOR);
  await expect(menu).toBeVisible();
  await menu.getByText("Align center").click();

  // Verify alignment was applied to ALL cells in the column (Markdown compatible)
  await expect(secondHeaderCell).toHaveCSS("text-align", "center");
  await expect(secondBodyCell).toHaveCSS("text-align", "center");

  // Verify other columns are NOT affected
  const firstHeaderCell = table.locator("th").first();
  const firstBodyCell = table.locator("td").first();
  await expect(firstHeaderCell).not.toHaveCSS("text-align", "center");
  await expect(firstBodyCell).not.toHaveCSS("text-align", "center");
}
