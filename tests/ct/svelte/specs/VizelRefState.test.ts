import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testVizelRefStateCharacterCount,
  testVizelRefStateInitialContent,
  testVizelRefStateUpdatesOnChange,
} from "../../scenarios/vizel-ref-state.scenario";
import VizelRefStateFixture from "./VizelRefStateFixture.svelte";

describe("Vizel + State Pattern (Vitest Browser) - Svelte", () => {
  test("shows correct character/word count after typing", async () => {
    render(VizelRefStateFixture, { props: { initialContent: "" } });
    await testVizelRefStateCharacterCount(page.elementLocator(document.body));
  });

  test("shows correct counts for initial content", async () => {
    render(VizelRefStateFixture);
    await testVizelRefStateInitialContent(page.elementLocator(document.body));
  });

  test("updates counts when adding more text", async () => {
    render(VizelRefStateFixture);
    await testVizelRefStateUpdatesOnChange(page.elementLocator(document.body));
  });
});
