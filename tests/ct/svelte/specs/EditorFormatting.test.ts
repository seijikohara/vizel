import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testBoldShortcut,
  testBulletList,
  testHeadingShortcut,
  testItalicShortcut,
  testOrderedList,
  testTaskListCheckboxToggle,
  testTaskListCheckedInputRule,
  testTaskListInputRule,
} from "../../scenarios/editor.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("Editor formatting (Vitest Browser) - Svelte", () => {
  test("applies heading shortcut", async () => {
    render(EditorFixture);
    await testHeadingShortcut(page.elementLocator(document.body));
  });

  test("applies bold shortcut", async () => {
    render(EditorFixture);
    await testBoldShortcut(page.elementLocator(document.body));
  });

  test("applies italic shortcut", async () => {
    render(EditorFixture);
    await testItalicShortcut(page.elementLocator(document.body));
  });

  test("builds a bullet list", async () => {
    render(EditorFixture);
    await testBulletList(page.elementLocator(document.body));
  });

  test("builds an ordered list", async () => {
    render(EditorFixture);
    await testOrderedList(page.elementLocator(document.body));
  });

  test("builds a task list via input rule", async () => {
    render(EditorFixture);
    await testTaskListInputRule(page.elementLocator(document.body));
  });

  test("toggles a task-list checkbox", async () => {
    render(EditorFixture);
    await testTaskListCheckboxToggle(page.elementLocator(document.body));
  });

  test("builds a pre-checked task item via input rule", async () => {
    render(EditorFixture);
    await testTaskListCheckedInputRule(page.elementLocator(document.body));
  });
});
