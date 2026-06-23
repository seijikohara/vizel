import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { testEditorRenders, testEditorTyping } from "../../scenarios/editor-bc.scenario";
import EditorFixture from "./EditorFixture.vue";

describe("Editor (Vitest Browser) - Vue", () => {
  test("renders and is editable", async () => {
    render(EditorFixture);
    await testEditorRenders(page.elementLocator(document.body));
  });

  test("accepts typed text", async () => {
    render(EditorFixture);
    await testEditorTyping(page.elementLocator(document.body));
  });
});
