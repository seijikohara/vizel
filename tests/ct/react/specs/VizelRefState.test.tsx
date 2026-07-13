import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import {
  testVizelRefStateCharacterCount,
  testVizelRefStateInitialContent,
  testVizelRefStateUpdatesOnChange,
} from "../../scenarios/vizel-ref-state.scenario";
import { VizelRefStateFixture } from "./VizelRefStateFixture";

describe("Vizel + State Pattern (Vitest Browser) - React", () => {
  test("shows correct character/word count after typing", async () => {
    await render(<VizelRefStateFixture initialContent="" />);
    await testVizelRefStateCharacterCount(page.elementLocator(document.body));
  });

  test("shows correct counts for initial content", async () => {
    await render(<VizelRefStateFixture />);
    await testVizelRefStateInitialContent(page.elementLocator(document.body));
  });

  test("updates counts when adding more text", async () => {
    await render(<VizelRefStateFixture />);
    await testVizelRefStateUpdatesOnChange(page.elementLocator(document.body));
  });
});
