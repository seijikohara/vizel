import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testBulletListAltArrowReorder,
  testBulletListShiftTabOutdent,
  testBulletListTabIndent,
  testOrderedListAltArrowReorder,
  testTaskListShiftTabOutdent,
  testTaskListTabIndent,
} from "../../scenarios/list-dnd.scenario";
import { EditorFixture } from "./EditorFixture";

describe("ListDnd (Vitest Browser) - React", () => {
  test("Tab indents a bullet list item", async () => {
    await render(<EditorFixture />);
    await testBulletListTabIndent(page.elementLocator(document.body));
  });

  test("Shift+Tab outdents a bullet list item", async () => {
    await render(<EditorFixture />);
    await testBulletListShiftTabOutdent(page.elementLocator(document.body));
  });

  test("Tab indents a task list item", async () => {
    await render(<EditorFixture />);
    await testTaskListTabIndent(page.elementLocator(document.body));
  });

  test("Shift+Tab outdents a task list item", async () => {
    await render(<EditorFixture />);
    await testTaskListShiftTabOutdent(page.elementLocator(document.body));
  });

  test("Alt+Arrow reorders bullet list items", async () => {
    await render(<EditorFixture />);
    await testBulletListAltArrowReorder(page.elementLocator(document.body));
  });

  test("Alt+Arrow reorders ordered list items", async () => {
    await render(<EditorFixture />);
    await testOrderedListAltArrowReorder(page.elementLocator(document.body));
  });
});
