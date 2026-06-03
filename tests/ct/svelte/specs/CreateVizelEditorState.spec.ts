import { test } from "@playwright/experimental-ct-svelte";
import {
  testEqualityFnShortCircuitsConsumer,
  testSelectorReadsTransaction,
  testSelectorReceivesEditorOnMount,
  testSelectorRerunsOnTransaction,
} from "../../scenarios/use-vizel-editor-state.scenario";
import CreateVizelEditorStateFixture from "./CreateVizelEditorStateFixture.svelte";

test.describe("createVizelEditorState - Svelte", () => {
  test("selector receives the editor on mount", async ({ mount, page }) => {
    const component = await mount(CreateVizelEditorStateFixture);
    await testSelectorReceivesEditorOnMount(component, page);
  });

  test("selector re-runs on every transaction", async ({ mount, page }) => {
    const component = await mount(CreateVizelEditorStateFixture);
    await testSelectorRerunsOnTransaction(component, page);
  });

  test("equalityFn short-circuits downstream consumers", async ({ mount, page }) => {
    const component = await mount(CreateVizelEditorStateFixture);
    await testEqualityFnShortCircuitsConsumer(component, page);
  });

  test("selector reads the transaction off the snapshot", async ({ mount, page }) => {
    const component = await mount(CreateVizelEditorStateFixture);
    await testSelectorReadsTransaction(component, page);
  });
});
