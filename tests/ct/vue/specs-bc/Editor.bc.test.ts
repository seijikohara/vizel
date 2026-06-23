import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { testEditorRenders, testEditorTyping } from "../../scenarios/editor-bc.scenario";
import EditorFixture from "./EditorFixture.vue";

describe("Editor (Vitest Browser) - Vue", () => {
  // Render once and run both scenarios sequentially. A second `render()` in the
  // same file races the auto-cleanup disposer in `mountVizelEditorView`, which
  // detaches the editor view while Tiptap is mid-teardown and throws. One render
  // per file keeps the editor view stable across both assertions.
  test("renders, is editable, and accepts typed text", async () => {
    render(EditorFixture);
    const root = page.elementLocator(document.body);
    await testEditorRenders(root);
    await testEditorTyping(root);
  });
});
