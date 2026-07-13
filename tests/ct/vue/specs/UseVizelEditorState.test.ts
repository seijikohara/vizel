import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import { page } from "vitest/browser";

import {
  testEqualityFnShortCircuitsConsumer,
  testSelectorReadsTransaction,
  testSelectorReceivesEditorOnMount,
  testSelectorRerunsOnTransaction,
} from "../../scenarios/use-vizel-editor-state.scenario";
import UseVizelEditorStateFixture from "./UseVizelEditorStateFixture.vue";

describe("useVizelEditorState (Vitest Browser) - Vue", () => {
  test("selector receives the editor on mount", async () => {
    render(UseVizelEditorStateFixture);
    await testSelectorReceivesEditorOnMount(page.elementLocator(document.body));
  });

  test("selector re-runs on every transaction", async () => {
    render(UseVizelEditorStateFixture);
    await testSelectorRerunsOnTransaction(page.elementLocator(document.body));
  });

  test("selector reads the transaction off the snapshot", async () => {
    render(UseVizelEditorStateFixture);
    await testSelectorReadsTransaction(page.elementLocator(document.body));
  });

  test("equalityFn short-circuits downstream consumers", async () => {
    render(UseVizelEditorStateFixture);
    await testEqualityFnShortCircuitsConsumer(page.elementLocator(document.body));
  });
});
