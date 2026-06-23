import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testEqualityFnShortCircuitsConsumer,
  testSelectorReadsTransaction,
  testSelectorReceivesEditorOnMount,
  testSelectorRerunsOnTransaction,
} from "../../scenarios/use-vizel-editor-state.scenario";
import CreateVizelEditorStateFixture from "./CreateVizelEditorStateFixture.svelte";

describe("createVizelEditorState (Vitest Browser) - Svelte", () => {
  test("selector receives the editor on mount", async () => {
    render(CreateVizelEditorStateFixture);
    await testSelectorReceivesEditorOnMount(page.elementLocator(document.body));
  });

  test("selector re-runs on every transaction", async () => {
    render(CreateVizelEditorStateFixture);
    await testSelectorRerunsOnTransaction(page.elementLocator(document.body));
  });

  test("selector reads the transaction off the snapshot", async () => {
    render(CreateVizelEditorStateFixture);
    await testSelectorReadsTransaction(page.elementLocator(document.body));
  });

  test("equalityFn short-circuits downstream consumers", async () => {
    render(CreateVizelEditorStateFixture);
    await testEqualityFnShortCircuitsConsumer(page.elementLocator(document.body));
  });
});
