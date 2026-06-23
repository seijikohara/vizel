import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testBoldShortcut,
  testBulletList,
  testHeadingShortcut,
  testItalicShortcut,
  testOrderedList,
  testTaskListCheckboxToggle,
  testTaskListCheckedInputRule,
  testTaskListInputRule,
} from "../../scenarios/editor-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor formatting (Vitest Browser) - React", () => {
  test("applies heading shortcut", async () => {
    await render(<EditorFixture />);
    await testHeadingShortcut(page.elementLocator(document.body));
  });

  test("applies bold shortcut", async () => {
    await render(<EditorFixture />);
    await testBoldShortcut(page.elementLocator(document.body));
  });

  test("applies italic shortcut", async () => {
    await render(<EditorFixture />);
    await testItalicShortcut(page.elementLocator(document.body));
  });

  test("builds a bullet list", async () => {
    await render(<EditorFixture />);
    await testBulletList(page.elementLocator(document.body));
  });

  test("builds an ordered list", async () => {
    await render(<EditorFixture />);
    await testOrderedList(page.elementLocator(document.body));
  });

  test("builds a task list via input rule", async () => {
    await render(<EditorFixture />);
    await testTaskListInputRule(page.elementLocator(document.body));
  });

  test("toggles a task-list checkbox", async () => {
    await render(<EditorFixture />);
    await testTaskListCheckboxToggle(page.elementLocator(document.body));
  });

  test("builds a pre-checked task item via input rule", async () => {
    await render(<EditorFixture />);
    await testTaskListCheckedInputRule(page.elementLocator(document.body));
  });
});
