// Table controls assert computed opacity and text-align, so the spec loads the
// Vizel stylesheet that the Vitest config does not inject globally.
import "@vizel/core/styles/index.scss";
import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
import { EditorFixture } from "./EditorFixture";

describe("TableControls (Vitest Browser) - React", () => {
  test("renders table with controls wrapper", async () => {
    await render(<EditorFixture />);
    await testTableRendersWithControls(page.elementLocator(document.body));
  });

  test("column insert button appears on hover", async () => {
    await render(<EditorFixture />);
    await testColumnInsertButtonAppearsOnHover(page.elementLocator(document.body));
  });

  test("column insert button adds a column", async () => {
    await render(<EditorFixture />);
    await testColumnInsertButtonAddsColumn(page.elementLocator(document.body));
  });

  test("row insert button appears on hover", async () => {
    await render(<EditorFixture />);
    await testRowInsertButtonAppearsOnHover(page.elementLocator(document.body));
  });

  test("row insert button adds a row", async () => {
    await render(<EditorFixture />);
    await testRowInsertButtonAddsRow(page.elementLocator(document.body));
  });

  test("row handle appears on cell hover", async () => {
    await render(<EditorFixture />);
    await testRowHandleAppearsOnCellHover(page.elementLocator(document.body));
  });

  test("row handle opens menu", async () => {
    await render(<EditorFixture />);
    await testRowHandleOpensMenu(page.elementLocator(document.body));
  });

  test("column handle appears on cell hover", async () => {
    await render(<EditorFixture />);
    await testColumnHandleAppearsOnCellHover(page.elementLocator(document.body));
  });

  test("column handle opens menu", async () => {
    await render(<EditorFixture />);
    await testColumnHandleOpensMenu(page.elementLocator(document.body));
  });

  test("row menu contains expected items", async () => {
    await render(<EditorFixture />);
    await testMenuContainsExpectedItems(page.elementLocator(document.body));
  });

  test("row menu closes on escape", async () => {
    await render(<EditorFixture />);
    await testMenuClosesOnEscape(page.elementLocator(document.body));
  });

  test("row menu closes on click outside", async () => {
    await render(<EditorFixture />);
    await testMenuClosesOnClickOutside(page.elementLocator(document.body));
  });

  test("column menu contains expected items", async () => {
    await render(<EditorFixture />);
    await testColumnMenuContainsExpectedItems(page.elementLocator(document.body));
  });

  test("adds row below via menu", async () => {
    await render(<EditorFixture />);
    await testMenuAddRowAction(page.elementLocator(document.body));
  });

  test("adds row above via menu", async () => {
    await render(<EditorFixture />);
    await testMenuAddRowAboveAction(page.elementLocator(document.body));
  });

  test("deletes row via menu", async () => {
    await render(<EditorFixture />);
    await testMenuDeleteRowAction(page.elementLocator(document.body));
  });

  test("toggles header row via menu", async () => {
    await render(<EditorFixture />);
    await testMenuToggleHeaderRowAction(page.elementLocator(document.body));
  });

  test("deletes table via menu", async () => {
    await render(<EditorFixture />);
    await testMenuDeleteTableAction(page.elementLocator(document.body));
  });

  test("adds column left via menu", async () => {
    await render(<EditorFixture />);
    await testMenuAddColumnLeftAction(page.elementLocator(document.body));
  });

  test("adds column right via menu", async () => {
    await render(<EditorFixture />);
    await testMenuAddColumnRightAction(page.elementLocator(document.body));
  });

  test("deletes column via menu", async () => {
    await render(<EditorFixture />);
    await testMenuDeleteColumnAction(page.elementLocator(document.body));
  });

  test("applies center alignment via menu", async () => {
    await render(<EditorFixture />);
    await testTextAlignmentViaMenu(page.elementLocator(document.body));
  });

  test("applies left alignment via menu", async () => {
    await render(<EditorFixture />);
    await testTextAlignmentLeftViaMenu(page.elementLocator(document.body));
  });

  test("applies right alignment via menu", async () => {
    await render(<EditorFixture />);
    await testTextAlignmentRightViaMenu(page.elementLocator(document.body));
  });
});
