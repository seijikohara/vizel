import { test } from "@playwright/experimental-ct-svelte";
import {
  testBlockOpDuplicatesCurrentBlock,
  testBlockOpMovesBlockDown,
  testBlockOpMovesBlockUp,
} from "../../scenarios/block-ops.scenario";
import BlockOpsFixture from "./BlockOpsFixture.svelte";

test.describe("VizelBlockOperationCommands - Svelte", () => {
  test("block/duplicate copies the current block below the original", async ({ mount, page }) => {
    const component = await mount(BlockOpsFixture);
    await testBlockOpDuplicatesCurrentBlock(component, page);
  });

  test("block/move-up swaps with the previous sibling", async ({ mount, page }) => {
    const component = await mount(BlockOpsFixture);
    await testBlockOpMovesBlockUp(component, page);
  });

  test("block/move-down swaps with the next sibling", async ({ mount, page }) => {
    const component = await mount(BlockOpsFixture);
    await testBlockOpMovesBlockDown(component, page);
  });
});
