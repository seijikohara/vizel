import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { isFirefox } from "../../scenarios/_vitest-context";
import {
  testCopyMultiBlockPaste,
  testCutListItemPreservesNesting,
  testPasteMarkdownConverts,
} from "../../scenarios/block-clipboard.scenario";
import { BlockClipboardFixture } from "./BlockClipboardFixture";

describe("VizelBlockClipboard (Vitest Browser) - React", () => {
  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)(
    "copy multi-block selection and paste reproduces every block",
    async () => {
      await render(<BlockClipboardFixture />);
      await testCopyMultiBlockPaste(page.elementLocator(document.body));
    }
  );

  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)("cut a nested list and paste preserves nesting", async () => {
    await render(<BlockClipboardFixture />);
    await testCutListItemPreservesNesting(page.elementLocator(document.body));
  });

  // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
  test.skipIf(isFirefox)("paste GFM markdown converts via the markdown pipeline", async () => {
    await render(<BlockClipboardFixture />);
    await testPasteMarkdownConverts(page.elementLocator(document.body));
  });
});
