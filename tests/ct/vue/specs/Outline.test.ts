import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import { page } from "vitest/browser";

import {
  testOutlineClickMovesSelection,
  testOutlineRendersHeadings,
} from "../../scenarios/outline.scenario";
import OutlineFixture from "./OutlineFixture.vue";

describe("VizelOutline (Vitest Browser) - Vue", () => {
  test("renders one entry per heading", async () => {
    render(OutlineFixture);
    await testOutlineRendersHeadings(page.elementLocator(document.body));
  });

  test("clicking an entry moves the selection", async () => {
    render(OutlineFixture);
    await testOutlineClickMovesSelection(page.elementLocator(document.body));
  });
});
