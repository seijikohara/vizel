import { test } from "@playwright/experimental-ct-svelte";
import {
  testBoldShortcut,
  testBulletList,
  testEditorPlaceholder,
  testEditorRenders,
  testEditorTyping,
  testHeadingShortcut,
  testItalicShortcut,
  testOrderedList,
  testTaskListCheckboxToggle,
  testTaskListCheckedInputRule,
  testTaskListInputRule,
} from "../../scenarios/editor.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("Editor - Svelte", () => {
  test("renders and is editable", async ({ mount }) => {
    const component = await mount(EditorFixture);
    await testEditorRenders(component);
  });

  test("accepts text input", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testEditorTyping(component, page);
  });

  test("shows placeholder when empty", async ({ mount }) => {
    const component = await mount(EditorFixture, {
      props: { placeholder: "Write something amazing..." },
    });
    await testEditorPlaceholder(component, "Write something amazing...");
  });

  test("applies heading with keyboard shortcut", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testHeadingShortcut(component, page);
  });

  test("applies bold with keyboard shortcut", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBoldShortcut(component, page);
  });

  test("applies italic with keyboard shortcut", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testItalicShortcut(component, page);
  });

  test("creates bullet list", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBulletList(component, page);
  });

  test("creates ordered list", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testOrderedList(component, page);
  });

  test("creates task list with input rule", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testTaskListInputRule(component, page);
  });

  test("toggles task list checkbox", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testTaskListCheckboxToggle(component, page);
  });

  test("creates checked task with [x] input rule", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testTaskListCheckedInputRule(component, page);
  });
});
