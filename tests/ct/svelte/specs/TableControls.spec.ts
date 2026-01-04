import { test } from "@playwright/experimental-ct-svelte";
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

  test.describe("Column Handle", () => {
    test("appears on cell hover", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testColumnHandleAppearsOnCellHover(component, page);
    });

    test("opens menu when clicked", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testColumnHandleOpensMenu(component, page);
    });
  });

  test.describe("Row Menu", () => {
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

  test.describe("Column Menu", () => {
    test("contains expected menu items", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testColumnMenuContainsExpectedItems(component, page);
    });
  });

  test.describe("Row Menu Actions", () => {
    test("adds row below via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuAddRowAction(component, page);
    });

    test("adds row above via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuAddRowAboveAction(component, page);
    });

    test("deletes row via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuDeleteRowAction(component, page);
    });

    test("toggles header row via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuToggleHeaderRowAction(component, page);
    });

    test("deletes table via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuDeleteTableAction(component, page);
    });
  });

  test.describe("Column Menu Actions", () => {
    test("adds column left via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuAddColumnLeftAction(component, page);
    });

    test("adds column right via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuAddColumnRightAction(component, page);
    });

    test("deletes column via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testMenuDeleteColumnAction(component, page);
    });
  });

  test.describe("Text Alignment", () => {
    test("applies center alignment via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTextAlignmentViaMenu(component, page);
    });

    test("applies left alignment via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTextAlignmentLeftViaMenu(component, page);
    });

    test("applies right alignment via menu", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTextAlignmentRightViaMenu(component, page);
    });
  });
});
