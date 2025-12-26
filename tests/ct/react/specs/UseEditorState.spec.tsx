import { test } from "@playwright/experimental-ct-react";
import {
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state.scenario";
import { UseEditorStateFixture } from "./UseEditorStateFixture";

test.describe("useEditorState - React", () => {
  test("updates when editor state changes", async ({ mount, page }) => {
    const component = await mount(<UseEditorStateFixture />);
    await testEditorStateUpdatesOnChange(component, page);
  });

  test("tracks bold formatting state", async ({ mount, page }) => {
    const component = await mount(<UseEditorStateFixture />);
    await testEditorStateTracksBoldActive(component, page);
  });

  test("tracks italic formatting state", async ({ mount, page }) => {
    const component = await mount(<UseEditorStateFixture />);
    await testEditorStateTracksItalicActive(component, page);
  });

  test("handles null editor", async ({ mount, page }) => {
    const component = await mount(<UseEditorStateFixture nullEditor={true} />);
    await testEditorStateWithNullEditor(component, page);
  });
});
