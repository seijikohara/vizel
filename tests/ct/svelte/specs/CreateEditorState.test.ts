import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testEditorStateCharacterCount,
  testEditorStateEmptyAndFocus,
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state.scenario";
import CreateEditorStateFixture from "./CreateEditorStateFixture.svelte";

describe("createEditorState (Vitest Browser) - Svelte", () => {
  test("updates when editor state changes", async () => {
    render(CreateEditorStateFixture);
    await testEditorStateUpdatesOnChange(page.elementLocator(document.body));
  });

  test("tracks bold formatting state", async () => {
    render(CreateEditorStateFixture);
    await testEditorStateTracksBoldActive(page.elementLocator(document.body));
  });

  test("tracks italic formatting state", async () => {
    render(CreateEditorStateFixture);
    await testEditorStateTracksItalicActive(page.elementLocator(document.body));
  });

  test("handles null editor", async () => {
    render(CreateEditorStateFixture, { props: { nullEditor: true } });
    await testEditorStateWithNullEditor(page.elementLocator(document.body));
  });

  test("tracks character and word count", async () => {
    render(CreateEditorStateFixture);
    await testEditorStateCharacterCount(page.elementLocator(document.body));
  });

  test("tracks empty and focus state", async () => {
    render(CreateEditorStateFixture);
    await testEditorStateEmptyAndFocus(page.elementLocator(document.body));
  });
});
