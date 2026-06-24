import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { testEditorRenders, testEditorTyping } from "../../scenarios/editor.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor (Vitest Browser) - React", () => {
  test("renders and is editable", async () => {
    await render(<EditorFixture />);
    await testEditorRenders(page.elementLocator(document.body));
  });

  test("accepts typed text", async () => {
    await render(<EditorFixture />);
    await testEditorTyping(page.elementLocator(document.body));
  });
});
