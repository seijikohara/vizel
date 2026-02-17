import { test } from "@playwright/experimental-ct-svelte";
import {
  testBulletListAltArrowReorder,
  testBulletListShiftTabOutdent,
  testBulletListTabIndent,
  testOrderedListAltArrowReorder,
  testTaskListShiftTabOutdent,
  testTaskListTabIndent,
} from "../../scenarios/list-dnd.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("ListDnd - Svelte", () => {
  test.describe("Bullet List Indentation", () => {
    test("Tab indents a bullet list item", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testBulletListTabIndent(component, page);
    });

    test("Shift+Tab outdents a bullet list item", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testBulletListShiftTabOutdent(component, page);
    });
  });

  test.describe("Task List Indentation", () => {
    test("Tab indents a task list item", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTaskListTabIndent(component, page);
    });

    test("Shift+Tab outdents a task list item", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testTaskListShiftTabOutdent(component, page);
    });
  });

  test.describe("Keyboard Reordering", () => {
    test("Alt+Arrow reorders bullet list items", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testBulletListAltArrowReorder(component, page);
    });

    test("Alt+Arrow reorders ordered list items", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testOrderedListAltArrowReorder(component, page);
    });
  });
});
