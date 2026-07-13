import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testOutlineClickMovesSelection,
  testOutlineRendersHeadings,
} from "../../scenarios/outline.scenario";
import OutlineFixture from "./OutlineFixture.svelte";

describe("VizelOutline (Vitest Browser) - Svelte", () => {
  test("renders one entry per heading", async () => {
    render(OutlineFixture);
    await testOutlineRendersHeadings(page.elementLocator(document.body));
  });

  test("clicking an entry moves the selection", async () => {
    render(OutlineFixture);
    await testOutlineClickMovesSelection(page.elementLocator(document.body));
  });
});
