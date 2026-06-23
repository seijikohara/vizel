// Table controls assert computed opacity and text-align, so the spec loads the
// Vizel stylesheet that the Vitest config does not inject globally.
import "@vizel/core/styles/index.scss";
import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testColumnHandleAppearsOnCellHover,
  testColumnHandleOpensMenu,
  testColumnInsertButtonAddsColumn,
  testColumnInsertButtonAppearsOnHover,
  testColumnMenuContainsExpectedItems,
  testMenuAddColumnLeftAction,
  testMenuAddColumnRightAction,
  testMenuAddRowAboveAction,
  testMenuAddRowAction,
  testMenuClosesOnClickOutside,
  testMenuClosesOnEscape,
  testMenuContainsExpectedItems,
  testMenuDeleteColumnAction,
  testMenuDeleteRowAction,
  testMenuDeleteTableAction,
  testMenuToggleHeaderRowAction,
  testRowHandleAppearsOnCellHover,
  testRowHandleOpensMenu,
  testRowInsertButtonAddsRow,
  testRowInsertButtonAppearsOnHover,
  testTableRendersWithControls,
  testTextAlignmentLeftViaMenu,
  testTextAlignmentRightViaMenu,
  testTextAlignmentViaMenu,
} from "../../scenarios/table-controls.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("TableControls (Vitest Browser) - Svelte", () => {
  test("renders table with controls wrapper", async () => {
    render(EditorFixture);
    await testTableRendersWithControls(page.elementLocator(document.body));
  });

  test("column insert button appears on hover", async () => {
    render(EditorFixture);
    await testColumnInsertButtonAppearsOnHover(page.elementLocator(document.body));
  });

  test("column insert button adds a column", async () => {
    render(EditorFixture);
    await testColumnInsertButtonAddsColumn(page.elementLocator(document.body));
  });

  test("row insert button appears on hover", async () => {
    render(EditorFixture);
    await testRowInsertButtonAppearsOnHover(page.elementLocator(document.body));
  });

  test("row insert button adds a row", async () => {
    render(EditorFixture);
    await testRowInsertButtonAddsRow(page.elementLocator(document.body));
  });

  test("row handle appears on cell hover", async () => {
    render(EditorFixture);
    await testRowHandleAppearsOnCellHover(page.elementLocator(document.body));
  });

  test("row handle opens menu", async () => {
    render(EditorFixture);
    await testRowHandleOpensMenu(page.elementLocator(document.body));
  });

  test("column handle appears on cell hover", async () => {
    render(EditorFixture);
    await testColumnHandleAppearsOnCellHover(page.elementLocator(document.body));
  });

  test("column handle opens menu", async () => {
    render(EditorFixture);
    await testColumnHandleOpensMenu(page.elementLocator(document.body));
  });

  test("row menu contains expected items", async () => {
    render(EditorFixture);
    await testMenuContainsExpectedItems(page.elementLocator(document.body));
  });

  test("row menu closes on escape", async () => {
    render(EditorFixture);
    await testMenuClosesOnEscape(page.elementLocator(document.body));
  });

  test("row menu closes on click outside", async () => {
    render(EditorFixture);
    await testMenuClosesOnClickOutside(page.elementLocator(document.body));
  });

  test("column menu contains expected items", async () => {
    render(EditorFixture);
    await testColumnMenuContainsExpectedItems(page.elementLocator(document.body));
  });

  test("adds row below via menu", async () => {
    render(EditorFixture);
    await testMenuAddRowAction(page.elementLocator(document.body));
  });

  test("adds row above via menu", async () => {
    render(EditorFixture);
    await testMenuAddRowAboveAction(page.elementLocator(document.body));
  });

  test("deletes row via menu", async () => {
    render(EditorFixture);
    await testMenuDeleteRowAction(page.elementLocator(document.body));
  });

  test("toggles header row via menu", async () => {
    render(EditorFixture);
    await testMenuToggleHeaderRowAction(page.elementLocator(document.body));
  });

  test("deletes table via menu", async () => {
    render(EditorFixture);
    await testMenuDeleteTableAction(page.elementLocator(document.body));
  });

  test("adds column left via menu", async () => {
    render(EditorFixture);
    await testMenuAddColumnLeftAction(page.elementLocator(document.body));
  });

  test("adds column right via menu", async () => {
    render(EditorFixture);
    await testMenuAddColumnRightAction(page.elementLocator(document.body));
  });

  test("deletes column via menu", async () => {
    render(EditorFixture);
    await testMenuDeleteColumnAction(page.elementLocator(document.body));
  });

  test("applies center alignment via menu", async () => {
    render(EditorFixture);
    await testTextAlignmentViaMenu(page.elementLocator(document.body));
  });

  test("applies left alignment via menu", async () => {
    render(EditorFixture);
    await testTextAlignmentLeftViaMenu(page.elementLocator(document.body));
  });

  test("applies right alignment via menu", async () => {
    render(EditorFixture);
    await testTextAlignmentRightViaMenu(page.elementLocator(document.body));
  });
});
