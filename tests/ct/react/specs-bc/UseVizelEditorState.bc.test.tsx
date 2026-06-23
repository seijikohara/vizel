import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testEqualityFnShortCircuitsConsumer,
  testSelectorReadsTransaction,
  testSelectorReceivesEditorOnMount,
  testSelectorRerunsOnTransaction,
} from "../../scenarios/use-vizel-editor-state-bc.scenario";
import { UseVizelEditorStateFixture } from "./UseVizelEditorStateFixture";

describe("useVizelEditorState (Vitest Browser) - React", () => {
  test("selector receives the editor on mount", async () => {
    await render(<UseVizelEditorStateFixture />);
    await testSelectorReceivesEditorOnMount(page.elementLocator(document.body));
  });

  test("selector re-runs on every transaction", async () => {
    await render(<UseVizelEditorStateFixture />);
    await testSelectorRerunsOnTransaction(page.elementLocator(document.body));
  });

  test("selector reads the transaction off the snapshot", async () => {
    await render(<UseVizelEditorStateFixture />);
    await testSelectorReadsTransaction(page.elementLocator(document.body));
  });

  test("equalityFn short-circuits downstream consumers", async () => {
    await render(<UseVizelEditorStateFixture />);
    await testEqualityFnShortCircuitsConsumer(page.elementLocator(document.body));
  });
});
