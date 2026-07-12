import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import {
  testBlockOpDuplicatesCurrentBlock,
  testBlockOpMovesBlockDown,
  testBlockOpMovesBlockUp,
} from "../../scenarios/block-ops.scenario";
import { BlockOpsFixture } from "./BlockOpsFixture";

describe("VizelBlockOperationCommands (Vitest Browser) - React", () => {
  test("block/duplicate copies the current block below the original", async () => {
    await render(<BlockOpsFixture />);
    await testBlockOpDuplicatesCurrentBlock(page.elementLocator(document.body));
  });

  test("block/move-up swaps with the previous sibling", async () => {
    await render(<BlockOpsFixture />);
    await testBlockOpMovesBlockUp(page.elementLocator(document.body));
  });

  test("block/move-down swaps with the next sibling", async () => {
    await render(<BlockOpsFixture />);
    await testBlockOpMovesBlockDown(page.elementLocator(document.body));
  });
});
