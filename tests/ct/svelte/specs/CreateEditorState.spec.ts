import { test } from "@playwright/experimental-ct-svelte";
import {
  testEditorStateCharacterCount,
  testEditorStateEmptyAndFocus,
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state.scenario";
import CreateEditorStateFixture from "./CreateEditorStateFixture.svelte";

test.describe("createEditorState - Svelte", () => {
  test("updates when editor state changes", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture);
    await testEditorStateUpdatesOnChange(component, page);
  });

  test("tracks bold formatting state", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture);
    await testEditorStateTracksBoldActive(component, page);
  });

  test("tracks italic formatting state", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture);
    await testEditorStateTracksItalicActive(component, page);
  });

  test("handles null editor", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture, {
      props: { nullEditor: true },
    });
    await testEditorStateWithNullEditor(component, page);
  });

  test("tracks character and word count", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture);
    await testEditorStateCharacterCount(component, page);
  });

  test("tracks empty and focus state", async ({ mount, page }) => {
    const component = await mount(CreateEditorStateFixture);
    await testEditorStateEmptyAndFocus(component, page);
  });
});
