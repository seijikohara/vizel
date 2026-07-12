import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";

import { testEditorPlaceholder } from "../../scenarios/editor.scenario";
import EditorFixture from "./EditorFixture.vue";

describe("Editor placeholder (Vitest Browser) - Vue", () => {
  test("shows the configured placeholder when empty", async () => {
    render(EditorFixture, { props: { placeholder: "Write something amazing..." } });
    await testEditorPlaceholder("Write something amazing...");
  });
});
