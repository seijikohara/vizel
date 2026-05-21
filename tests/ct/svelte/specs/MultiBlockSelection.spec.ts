import { test } from "@playwright/experimental-ct-svelte";
import {
  testBackspaceDeletesMultiBlockRange,
  testShiftDownSelectsTwoBlocks,
} from "../../scenarios/multi-block-selection.scenario";
import MultiBlockSelectionFixture from "./MultiBlockSelectionFixture.svelte";

test.describe("VizelMultiBlockSelection - Svelte", () => {
  test("Shift+Down selects two blocks and decorates each one", async ({ mount, page }) => {
    const component = await mount(MultiBlockSelectionFixture);
    await testShiftDownSelectsTwoBlocks(component, page);
  });

  test("Backspace deletes every block in the range", async ({ mount, page }) => {
    const component = await mount(MultiBlockSelectionFixture);
    await testBackspaceDeletesMultiBlockRange(component, page);
  });
});
