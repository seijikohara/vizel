import {
  assertMarkdownRoundtrip,
  type VizelMarkdownFlavor,
  type VizelRoundtripSample,
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "@vizel/core";
import { useEffect } from "react";

/**
 * Minimal fixture that hands the round-trip helper and the built-in
 * flavor plugins to the surrounding test runner via `window`. The
 * fixture renders nothing of substance — Playwright's `page.evaluate`
 * is what actually runs each round-trip assertion against the live
 * `@vizel/core` build.
 */
export function RoundtripFixture() {
  useEffect(() => {
    const win = window as unknown as {
      vizelAssertMarkdownRoundtrip?: (
        flavor: VizelMarkdownFlavor,
        samples: readonly VizelRoundtripSample[]
      ) => Promise<void>;
      vizelMarkdownFlavors?: Record<string, VizelMarkdownFlavor>;
    };
    win.vizelAssertMarkdownRoundtrip = assertMarkdownRoundtrip;
    win.vizelMarkdownFlavors = {
      commonmark: vizelCommonMarkFlavor,
      gfm: vizelGfmFlavor,
      obsidian: vizelObsidianFlavor,
      docusaurus: vizelDocusaurusFlavor,
      pandoc: vizelPandocFlavor,
    };
    return () => {
      delete win.vizelAssertMarkdownRoundtrip;
      delete win.vizelMarkdownFlavors;
    };
  }, []);

  return <div data-testid="roundtrip-fixture-ready" />;
}
