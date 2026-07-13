import { describe, test } from "vitest";
import { render } from "vitest-browser-react";

import { testEditorPlaceholder } from "../../scenarios/editor.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor placeholder (Vitest Browser) - React", () => {
  test("shows the configured placeholder when empty", async () => {
    await render(<EditorFixture placeholder="Write something amazing..." />);
    await testEditorPlaceholder("Write something amazing...");
  });
});
