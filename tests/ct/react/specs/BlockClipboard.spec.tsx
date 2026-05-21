import { test } from "@playwright/experimental-ct-react";
import {
  testCopyMultiBlockPaste,
  testCutListItemPreservesNesting,
  testPasteMarkdownConverts,
} from "../../scenarios/block-clipboard.scenario";
import { BlockClipboardFixture } from "./BlockClipboardFixture";

test.describe("VizelBlockClipboard - React", () => {
  // Firefox silently drops writes to a programmatically-constructed
  // `ClipboardEvent`'s `clipboardData`, so the synthetic copy / paste
  // dispatch our scenarios use cannot exercise the round-trip in
  // Firefox. The production code path works in real Firefox usage
  // because real keyboard-triggered clipboard events have writable
  // `clipboardData`.
  test.skip(
    ({ browserName }) => browserName === "firefox",
    "synthetic ClipboardEvent dispatch unsupported in Firefox"
  );

  test("copy multi-block selection and paste reproduces every block", async ({ mount, page }) => {
    const component = await mount(<BlockClipboardFixture />);
    await testCopyMultiBlockPaste(component, page);
  });

  test("cut a nested list and paste preserves nesting", async ({ mount, page }) => {
    const component = await mount(<BlockClipboardFixture />);
    await testCutListItemPreservesNesting(component, page);
  });

  test("paste GFM markdown converts via the markdown pipeline", async ({ mount, page }) => {
    const component = await mount(<BlockClipboardFixture />);
    await testPasteMarkdownConverts(component, page);
  });
});
