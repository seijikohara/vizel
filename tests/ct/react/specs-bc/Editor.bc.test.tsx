import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { testEditorRenders } from "../../scenarios/editor-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor (Vitest Browser) - React", () => {
  test("renders and is editable", async () => {
    await render(<EditorFixture />);
    await testEditorRenders(page.elementLocator(document.body));
  });
});
