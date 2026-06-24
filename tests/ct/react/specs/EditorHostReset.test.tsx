// The host-reset scenarios read computed styles, so the editor must carry its
// real CSS. The Playwright runner loads it globally; here each host-reset spec
// imports the Vizel stylesheet so its unlayered rules can win over the injected
// `@layer base` reset.
import "@vizel/core/styles/index.scss";
import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testBlockSpacingSurvivesHostReset,
  testLinkInputBackgroundSurvivesHostReset,
  testListMarkersSurviveHostReset,
} from "../../scenarios/editor.scenario";
import { CssResetFixture } from "./CssResetFixture";

describe("Editor host CSS reset (Vitest Browser) - React", () => {
  test("list markers survive a host CSS reset", async () => {
    await render(<CssResetFixture />);
    await testListMarkersSurviveHostReset(page.elementLocator(document.body));
  });

  test("block spacing survives a host CSS reset", async () => {
    await render(<CssResetFixture />);
    await testBlockSpacingSurvivesHostReset(page.elementLocator(document.body));
  });

  test("link input background survives a host CSS reset", async () => {
    await render(<CssResetFixture />);
    await testLinkInputBackgroundSurvivesHostReset(page.elementLocator(document.body));
  });
});
