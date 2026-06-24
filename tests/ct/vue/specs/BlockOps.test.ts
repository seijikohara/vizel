import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testBlockOpDuplicatesCurrentBlock,
  testBlockOpMovesBlockDown,
  testBlockOpMovesBlockUp,
} from "../../scenarios/block-ops.scenario";
import BlockOpsFixture from "./BlockOpsFixture.vue";

describe("VizelBlockOperationCommands (Vitest Browser) - Vue", () => {
  test("block/duplicate copies the current block below the original", async () => {
    render(BlockOpsFixture);
    await testBlockOpDuplicatesCurrentBlock(page.elementLocator(document.body));
  });

  test("block/move-up swaps with the previous sibling", async () => {
    render(BlockOpsFixture);
    await testBlockOpMovesBlockUp(page.elementLocator(document.body));
  });

  test("block/move-down swaps with the next sibling", async () => {
    render(BlockOpsFixture);
    await testBlockOpMovesBlockDown(page.elementLocator(document.body));
  });
});
