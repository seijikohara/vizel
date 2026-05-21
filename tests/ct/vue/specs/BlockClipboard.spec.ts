import { test } from "@playwright/experimental-ct-vue";
import {
  testCopyMultiBlockPaste,
  testCutListItemPreservesNesting,
  testPasteMarkdownConverts,
} from "../../scenarios/block-clipboard.scenario";
import BlockClipboardFixture from "./BlockClipboardFixture.vue";

test.describe("VizelBlockClipboard - Vue", () => {
  test.skip(
    ({ browserName }) => browserName === "firefox",
    "synthetic ClipboardEvent dispatch unsupported in Firefox"
  );

  test("copy multi-block selection and paste reproduces every block", async ({ mount, page }) => {
    const component = await mount(BlockClipboardFixture);
    await testCopyMultiBlockPaste(component, page);
  });

  test("cut a nested list and paste preserves nesting", async ({ mount, page }) => {
    const component = await mount(BlockClipboardFixture);
    await testCutListItemPreservesNesting(component, page);
  });

  test("paste GFM markdown converts via the markdown pipeline", async ({ mount, page }) => {
    const component = await mount(BlockClipboardFixture);
    await testPasteMarkdownConverts(component, page);
  });
});
