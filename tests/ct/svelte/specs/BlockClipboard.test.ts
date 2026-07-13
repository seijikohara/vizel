import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import { isFirefox } from "../../scenarios/_vitest-context";
import {
  testCopyMultiBlockPaste,
  testCutListItemPreservesNesting,
  testPasteMarkdownConverts,
} from "../../scenarios/block-clipboard.scenario";
import BlockClipboardFixture from "./BlockClipboardFixture.svelte";

describe("VizelBlockClipboard (Vitest Browser) - Svelte", () => {
  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)(
    "copy multi-block selection and paste reproduces every block",
    async () => {
      render(BlockClipboardFixture);
      await testCopyMultiBlockPaste(page.elementLocator(document.body));
    }
  );

  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)("cut a nested list and paste preserves nesting", async () => {
    render(BlockClipboardFixture);
    await testCutListItemPreservesNesting(page.elementLocator(document.body));
  });

  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)("paste GFM markdown converts via the markdown pipeline", async () => {
    render(BlockClipboardFixture);
    await testPasteMarkdownConverts(page.elementLocator(document.body));
  });
});
