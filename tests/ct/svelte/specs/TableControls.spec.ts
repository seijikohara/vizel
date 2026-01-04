import { test } from "@playwright/experimental-ct-svelte";
import {
  testColumnInsertButtonAddsColumn,
  testColumnInsertButtonAppearsOnHover,
  testMenuAddRowAction,
  testMenuClosesOnClickOutside,
  testMenuClosesOnEscape,
  testMenuContainsExpectedItems,
  testMenuDeleteRowAction,
  testMenuDeleteTableAction,
  testRowHandleAppearsOnCellHover,
  testRowHandleOpensMenu,
  testRowInsertButtonAddsRow,
  testRowInsertButtonAppearsOnHover,
  testTableRendersWithControls,
  testTextAlignmentViaMenu,
} from "../../scenarios/table-controls.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("TableControls - Svelte", () => {
  test.describe("Table Rendering", () => {
    test("renders table with controls wrapper", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTableRendersWithControls(component, page);
    });
  });

  test.describe("Column Insert Button", () => {
    test("appears on hover near column border", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testColumnInsertButtonAppearsOnHover(component, page);
    });

    test("adds column when clicked", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testColumnInsertButtonAddsColumn(component, page);
    });
  });

  test.describe("Row Insert Button", () => {
    test("appears on hover near row border", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRowInsertButtonAppearsOnHover(component, page);
    });

    test("adds row when clicked", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRowInsertButtonAddsRow(component, page);
    });
  });

  test.describe("Row Handle", () => {
    test("appears on cell hover", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRowHandleAppearsOnCellHover(component, page);
    });

    test("opens menu when clicked", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRowHandleOpensMenu(component, page);
    });
  });

  test.describe("Table Menu", () => {
    test("contains expected menu items", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuContainsExpectedItems(component, page);
    });

    test("closes on escape key", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuClosesOnEscape(component, page);
    });

    test("closes on click outside", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuClosesOnClickOutside(component, page);
    });
  });

  test.describe("Menu Actions", () => {
    test("adds row via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuAddRowAction(component, page);
    });

    test("deletes row via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuDeleteRowAction(component, page);
    });

    test("deletes table via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuDeleteTableAction(component, page);
    });

    test("applies text alignment via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTextAlignmentViaMenu(component, page);
    });
  });
});
