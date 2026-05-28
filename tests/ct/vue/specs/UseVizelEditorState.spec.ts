import { test } from "@playwright/experimental-ct-vue";
import {
  testEqualityFnShortCircuitsConsumer,
  testSelectorReceivesEditorOnMount,
  testSelectorRerunsOnTransaction,
} from "../../scenarios/use-vizel-editor-state.scenario";
import UseVizelEditorStateFixture from "./UseVizelEditorStateFixture.vue";

test.describe("useVizelEditorState - Vue", () => {
  test("selector receives the editor on mount", async ({ mount, page }) => {
    const component = await mount(UseVizelEditorStateFixture);
    await testSelectorReceivesEditorOnMount(component, page);
  });

  test("selector re-runs on every transaction", async ({ mount, page }) => {
    const component = await mount(UseVizelEditorStateFixture);
    await testSelectorRerunsOnTransaction(component, page);
  });

  test("equalityFn short-circuits downstream consumers", async ({ mount, page }) => {
    const component = await mount(UseVizelEditorStateFixture);
    await testEqualityFnShortCircuitsConsumer(component, page);
  });
});
