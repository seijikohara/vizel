import {
  assertMarkdownRoundtrip,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "@vizel/core";
import { describe, test } from "vitest";
import {
  commonmarkSamples,
  docusaurusSamples,
  gfmSamples,
  obsidianSamples,
  pandocSamples,
} from "../samples/index";

// The test runs inside the browser, so it calls `assertMarkdownRoundtrip`
// directly against the live `@vizel/core` build. The Playwright suite needed a
// `window` bridge plus a fixture render to reach in-browser code from Node; the
// Vitest browser context removes both. `assertMarkdownRoundtrip` throws a
// `VizelError("MARKDOWN_LOSSY")` when a sample does not survive the round-trip,
// which fails the test, so no extra assertion is required.
describe("Markdown round-trip (Vitest Browser)", () => {
  test("commonmark flavor preserves representative samples", async () => {
    await assertMarkdownRoundtrip(vizelCommonMarkFlavor, commonmarkSamples);
  });

  test("gfm flavor preserves representative samples", async () => {
    await assertMarkdownRoundtrip(vizelGfmFlavor, gfmSamples);
  });

  test("obsidian flavor preserves representative samples", async () => {
    await assertMarkdownRoundtrip(vizelObsidianFlavor, obsidianSamples);
  });

  test("docusaurus flavor preserves representative samples", async () => {
    await assertMarkdownRoundtrip(vizelDocusaurusFlavor, docusaurusSamples);
  });

  test("pandoc flavor preserves representative samples", async () => {
    await assertMarkdownRoundtrip(vizelPandocFlavor, pandocSamples);
  });
});
