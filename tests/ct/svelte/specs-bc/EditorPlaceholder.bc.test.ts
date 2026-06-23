import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { testEditorPlaceholder } from "../../scenarios/editor-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("Editor placeholder (Vitest Browser) - Svelte", () => {
  test("shows the configured placeholder when empty", async () => {
    render(EditorFixture, { props: { placeholder: "Write something amazing..." } });
    await testEditorPlaceholder("Write something amazing...");
  });
});
