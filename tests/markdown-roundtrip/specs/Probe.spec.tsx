import { test } from "@playwright/experimental-ct-react";
import {
  commonmarkSamples,
  docusaurusSamples,
  gfmSamples,
  obsidianSamples,
  pandocSamples,
} from "../samples/index.ts";
import { RoundtripFixture } from "./RoundtripFixture";

/**
 * Diagnostic spec that does NOT assert — it logs per-sample
 * round-trip behavior to the test output. Run via
 * `pnpm test:md-roundtrip --grep probe` to refresh the catalog.
 *
 * This spec is skipped by default and lives in-tree only to make it
 * cheap to debug round-trip failures locally. It carries no
 * Section 10 acceptance criteria; the real assertions live in
 * `Roundtrip.spec.tsx`.
 */

const ALL_SAMPLES: Record<string, readonly { name: string; input: string }[]> = {
  commonmark: commonmarkSamples,
  gfm: gfmSamples,
  obsidian: obsidianSamples,
  docusaurus: docusaurusSamples,
  pandoc: pandocSamples,
};

test.describe("Markdown round-trip probe", () => {
  for (const [flavorKey, samples] of Object.entries(ALL_SAMPLES)) {
    for (const sample of samples) {
      test(`probe ${flavorKey} ${sample.name}`, async ({ mount, page }) => {
        await mount(<RoundtripFixture />);
        await page.waitForFunction(
          () =>
            typeof (window as { vizelAssertMarkdownRoundtrip?: unknown })
              .vizelAssertMarkdownRoundtrip === "function"
        );
        const _out = await page.evaluate(
          async ({
            flavorKey: key,
            sample: payload,
          }: {
            flavorKey: string;
            sample: { name: string; input: string };
          }) => {
            const win = window as unknown as {
              vizelAssertMarkdownRoundtrip?: (
                flavor: unknown,
                samples: readonly { name: string; input: string }[]
              ) => Promise<void>;
              vizelMarkdownFlavors?: Record<string, unknown>;
            };
            const flavor = win.vizelMarkdownFlavors?.[key];
            const assertFn = win.vizelAssertMarkdownRoundtrip;
            if (!(flavor && assertFn)) return "missing fixture";
            try {
              await assertFn(flavor, [payload]);
              return "PASS";
            } catch (error) {
              const err = error as {
                context?: { expected?: string; received?: string };
              };
              return `FAIL\nexpected=${JSON.stringify(err.context?.expected ?? "")}\nreceived=${JSON.stringify(err.context?.received ?? "")}`;
            }
          },
          { flavorKey, sample }
        );
      });
    }
  }
});
