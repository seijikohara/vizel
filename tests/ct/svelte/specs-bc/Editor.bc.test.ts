import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { testEditorRenders, testEditorTyping } from "../../scenarios/editor-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("Editor (Vitest Browser) - Svelte", () => {
  test("renders and is editable", async () => {
    render(EditorFixture);
    await testEditorRenders(page.elementLocator(document.body));
  });

  test("accepts typed text", async () => {
    render(EditorFixture);
    await testEditorTyping(page.elementLocator(document.body));
  });
});
