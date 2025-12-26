import { test } from "@playwright/experimental-ct-vue";
import {
  testBoldShortcut,
  testBulletList,
  testEditorPlaceholder,
  testEditorRenders,
  testEditorTyping,
  testHeadingShortcut,
  testItalicShortcut,
  testOrderedList,
} from "../../scenarios/editor.scenario";
import EditorFixture from "./EditorFixture.vue";

test.describe("Editor - Vue", () => {
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
});
