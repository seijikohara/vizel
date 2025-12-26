import { test } from "@playwright/experimental-ct-svelte";
import {
  testEditorStateCharacterCount,
  testEditorStateEmptyAndFocus,
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state.scenario";
import UseEditorStateFixture from "./UseEditorStateFixture.svelte";

test.describe("useEditorState - Svelte", () => {
  test("updates when editor state changes", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture);
    await testEditorStateUpdatesOnChange(component, page);
  });

  test("tracks bold formatting state", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture);
    await testEditorStateTracksBoldActive(component, page);
  });

  test("tracks italic formatting state", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture);
    await testEditorStateTracksItalicActive(component, page);
  });

  test("handles null editor", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture, {
      props: { nullEditor: true },
    });
    await testEditorStateWithNullEditor(component, page);
  });

  test("tracks character and word count", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture);
    await testEditorStateCharacterCount(component, page);
  });

  test("tracks empty and focus state", async ({ mount, page }) => {
    const component = await mount(UseEditorStateFixture);
    await testEditorStateEmptyAndFocus(component, page);
  });
});
