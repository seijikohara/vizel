import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testCopyMultiBlockPaste,
  testCutListItemPreservesNesting,
  testPasteMarkdownConverts,
} from "../../scenarios/block-clipboard-bc.scenario";
import BlockClipboardFixture from "./BlockClipboardFixture.svelte";

describe("VizelBlockClipboard (Vitest Browser) - Svelte", () => {
  test("copy multi-block selection and paste reproduces every block", async () => {
    render(BlockClipboardFixture);
    await testCopyMultiBlockPaste(page.elementLocator(document.body));
  });

  test("cut a nested list and paste preserves nesting", async () => {
    render(BlockClipboardFixture);
    await testCutListItemPreservesNesting(page.elementLocator(document.body));
  });

  test("paste GFM markdown converts via the markdown pipeline", async () => {
    render(BlockClipboardFixture);
    await testPasteMarkdownConverts(page.elementLocator(document.body));
  });
});
