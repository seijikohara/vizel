import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testBackspaceDeletesMultiBlockRange,
  testShiftDownSelectsTwoBlocks,
} from "../../scenarios/multi-block-selection.scenario";
import MultiBlockSelectionFixture from "./MultiBlockSelectionFixture.vue";

describe("VizelMultiBlockSelection (Vitest Browser) - Vue", () => {
  test("Shift+Down selects two blocks and decorates each one", async () => {
    render(MultiBlockSelectionFixture);
    await testShiftDownSelectsTwoBlocks(page.elementLocator(document.body));
  });

  test("Backspace deletes every block in the range", async () => {
    render(MultiBlockSelectionFixture);
    await testBackspaceDeletesMultiBlockRange(page.elementLocator(document.body));
  });
});
