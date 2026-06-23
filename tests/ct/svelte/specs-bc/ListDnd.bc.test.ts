import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testBulletListAltArrowReorder,
  testBulletListShiftTabOutdent,
  testBulletListTabIndent,
  testOrderedListAltArrowReorder,
  testTaskListShiftTabOutdent,
  testTaskListTabIndent,
} from "../../scenarios/list-dnd-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("ListDnd (Vitest Browser) - Svelte", () => {
  test("Tab indents a bullet list item", async () => {
    render(EditorFixture);
    await testBulletListTabIndent(page.elementLocator(document.body));
  });

  test("Shift+Tab outdents a bullet list item", async () => {
    render(EditorFixture);
    await testBulletListShiftTabOutdent(page.elementLocator(document.body));
  });

  test("Tab indents a task list item", async () => {
    render(EditorFixture);
    await testTaskListTabIndent(page.elementLocator(document.body));
  });

  test("Shift+Tab outdents a task list item", async () => {
    render(EditorFixture);
    await testTaskListShiftTabOutdent(page.elementLocator(document.body));
  });

  test("Alt+Arrow reorders bullet list items", async () => {
    render(EditorFixture);
    await testBulletListAltArrowReorder(page.elementLocator(document.body));
  });

  test("Alt+Arrow reorders ordered list items", async () => {
    render(EditorFixture);
    await testOrderedListAltArrowReorder(page.elementLocator(document.body));
  });
});
