import { test } from "@playwright/experimental-ct-svelte";
import {
  testVizelRefStateCharacterCount,
  testVizelRefStateInitialContent,
  testVizelRefStateUpdatesOnChange,
} from "../../scenarios/vizel-ref-state.scenario";
import VizelRefStateFixture from "./VizelRefStateFixture.svelte";

test.describe("Vizel + State Pattern - Svelte", () => {
  test("shows correct character/word count after typing", async ({ mount, page }) => {
    const component = await mount(VizelRefStateFixture, {
      props: { initialContent: "" },
    });
    await testVizelRefStateCharacterCount(component, page);
  });

  test("shows correct counts for initial content", async ({ mount, page }) => {
    const component = await mount(VizelRefStateFixture);
    await testVizelRefStateInitialContent(component, page);
  });

  test("updates counts when adding more text", async ({ mount, page }) => {
    const component = await mount(VizelRefStateFixture);
    await testVizelRefStateUpdatesOnChange(component, page);
  });
});
