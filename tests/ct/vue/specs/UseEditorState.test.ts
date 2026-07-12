import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import { page } from "vitest/browser";

import {
  testEditorStateCharacterCount,
  testEditorStateEmptyAndFocus,
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state.scenario";
import UseEditorStateFixture from "./UseEditorStateFixture.vue";

describe("useEditorState (Vitest Browser) - Vue", () => {
  test("updates when editor state changes", async () => {
    render(UseEditorStateFixture);
    await testEditorStateUpdatesOnChange(page.elementLocator(document.body));
  });

  test("tracks bold formatting state", async () => {
    render(UseEditorStateFixture);
    await testEditorStateTracksBoldActive(page.elementLocator(document.body));
  });

  test("tracks italic formatting state", async () => {
    render(UseEditorStateFixture);
    await testEditorStateTracksItalicActive(page.elementLocator(document.body));
  });

  test("handles null editor", async () => {
    render(UseEditorStateFixture, { props: { nullEditor: true } });
    await testEditorStateWithNullEditor(page.elementLocator(document.body));
  });

  test("tracks character and word count", async () => {
    render(UseEditorStateFixture);
    await testEditorStateCharacterCount(page.elementLocator(document.body));
  });

  test("tracks empty and focus state", async () => {
    render(UseEditorStateFixture);
    await testEditorStateEmptyAndFocus(page.elementLocator(document.body));
  });
});
