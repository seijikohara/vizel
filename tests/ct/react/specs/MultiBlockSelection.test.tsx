import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testBackspaceDeletesMultiBlockRange,
  testShiftDownSelectsTwoBlocks,
} from "../../scenarios/multi-block-selection.scenario";
import { MultiBlockSelectionFixture } from "./MultiBlockSelectionFixture";

describe("VizelMultiBlockSelection (Vitest Browser) - React", () => {
  test("Shift+Down selects two blocks and decorates each one", async () => {
    await render(<MultiBlockSelectionFixture />);
    await testShiftDownSelectsTwoBlocks(page.elementLocator(document.body));
  });

  test("Backspace deletes every block in the range", async () => {
    await render(<MultiBlockSelectionFixture />);
    await testBackspaceDeletesMultiBlockRange(page.elementLocator(document.body));
  });
});
