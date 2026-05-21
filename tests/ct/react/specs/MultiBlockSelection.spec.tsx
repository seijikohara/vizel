import { test } from "@playwright/experimental-ct-react";
import {
  testBackspaceDeletesMultiBlockRange,
  testShiftDownSelectsTwoBlocks,
} from "../../scenarios/multi-block-selection.scenario";
import { MultiBlockSelectionFixture } from "./MultiBlockSelectionFixture";

test.describe("VizelMultiBlockSelection - React", () => {
  test("Shift+Down selects two blocks and decorates each one", async ({ mount, page }) => {
    const component = await mount(<MultiBlockSelectionFixture />);
    await testShiftDownSelectsTwoBlocks(component, page);
  });

  test("Backspace deletes every block in the range", async ({ mount, page }) => {
    const component = await mount(<MultiBlockSelectionFixture />);
    await testBackspaceDeletesMultiBlockRange(component, page);
  });
});
