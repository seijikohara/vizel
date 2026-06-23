import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testEditorStateCharacterCount,
  testEditorStateEmptyAndFocus,
  testEditorStateTracksBoldActive,
  testEditorStateTracksItalicActive,
  testEditorStateUpdatesOnChange,
  testEditorStateWithNullEditor,
} from "../../scenarios/use-editor-state-bc.scenario";
import { UseEditorStateFixture } from "./UseEditorStateFixture";

describe("useEditorState (Vitest Browser) - React", () => {
  test("updates when editor state changes", async () => {
    await render(<UseEditorStateFixture />);
    await testEditorStateUpdatesOnChange(page.elementLocator(document.body));
  });

  test("tracks bold formatting state", async () => {
    await render(<UseEditorStateFixture />);
    await testEditorStateTracksBoldActive(page.elementLocator(document.body));
  });

  test("tracks italic formatting state", async () => {
    await render(<UseEditorStateFixture />);
    await testEditorStateTracksItalicActive(page.elementLocator(document.body));
  });

  test("handles null editor", async () => {
    await render(<UseEditorStateFixture nullEditor={true} />);
    await testEditorStateWithNullEditor(page.elementLocator(document.body));
  });

  test("tracks character and word count", async () => {
    await render(<UseEditorStateFixture />);
    await testEditorStateCharacterCount(page.elementLocator(document.body));
  });

  test("tracks empty and focus state", async () => {
    await render(<UseEditorStateFixture />);
    await testEditorStateEmptyAndFocus(page.elementLocator(document.body));
  });
});
