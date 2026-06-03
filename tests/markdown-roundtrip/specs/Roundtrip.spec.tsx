import { expect, test } from "@playwright/experimental-ct-react";
import {
  commonmarkSamples,
  docusaurusSamples,
  gfmSamples,
  obsidianSamples,
  pandocSamples,
} from "../samples/index.ts";
import { RoundtripFixture } from "./RoundtripFixture";

/**
 * Markdown round-trip suite.
 *
 * Each test mounts {@link RoundtripFixture}, then drives
 * `assertMarkdownRoundtrip(flavor, samples)` through `page.evaluate`
 * so the assertion runs against the live `@vizel/core` runtime in the
 * browser. The fixture itself does nothing more than publish the
 * helper and the five built-in flavors on `window`.
 *
 * The samples are a representative cross-section, not the full target
 * of 100+ × 5 flavors. Expanding the sample buckets is tracked as
 * follow-up work.
 */

interface FlavorEvalResult {
  readonly ok: boolean;
  readonly message?: string;
  readonly sample?: string;
  readonly expected?: string;
  readonly received?: string;
}

const runRoundtripInBrowser = async (
  page: import("@playwright/test").Page,
  flavorKey: string,
  samples: readonly { name: string; input: string }[]
): Promise<FlavorEvalResult> => {
  await page.waitForFunction(
    () =>
      typeof (window as { vizelAssertMarkdownRoundtrip?: unknown }).vizelAssertMarkdownRoundtrip ===
      "function"
  );
  return page.evaluate(
    async ({
      flavorKey: key,
      samples: payload,
    }: {
      flavorKey: string;
      samples: readonly { name: string; input: string }[];
    }) => {
      const win = window as unknown as {
        vizelAssertMarkdownRoundtrip?: (
          flavor: unknown,
          samples: readonly { name: string; input: string }[]
        ) => Promise<void>;
        vizelMarkdownFlavors?: Record<string, unknown>;
      };
      const assertFn = win.vizelAssertMarkdownRoundtrip;
      const flavor = win.vizelMarkdownFlavors?.[key];
      if (!(assertFn && flavor)) {
        return {
          ok: false,
          message: `fixture missing helper or flavor "${key}"`,
        };
      }
      try {
        await assertFn(flavor, payload);
        return { ok: true };
      } catch (error) {
        const err = error as {
          message?: string;
          context?: { sample?: string; expected?: string; received?: string };
        };
        return {
          ok: false,
          message: err?.message ?? String(error),
          sample: err?.context?.sample,
          expected: err?.context?.expected,
          received: err?.context?.received,
        };
      }
    },
    { flavorKey, samples: [...samples] }
  );
};

const describeResult = (result: FlavorEvalResult): string => {
  if (result.ok) return "ok";
  return [
    `sample=${result.sample ?? "<unknown>"}`,
    `expected=${JSON.stringify(result.expected ?? "")}`,
    `received=${JSON.stringify(result.received ?? "")}`,
  ].join(" | ");
};

test.describe("Markdown round-trip", () => {
  test("commonmark flavor preserves representative samples", async ({ mount, page }) => {
    await mount(<RoundtripFixture />);
    const result = await runRoundtripInBrowser(page, "commonmark", commonmarkSamples);
    expect(result, `commonmark failure: ${describeResult(result)}`).toEqual({ ok: true });
  });

  test("gfm flavor preserves representative samples", async ({ mount, page }) => {
    await mount(<RoundtripFixture />);
    const result = await runRoundtripInBrowser(page, "gfm", gfmSamples);
    expect(result, `gfm failure: ${describeResult(result)}`).toEqual({ ok: true });
  });

  test("obsidian flavor preserves representative samples", async ({ mount, page }) => {
    await mount(<RoundtripFixture />);
    const result = await runRoundtripInBrowser(page, "obsidian", obsidianSamples);
    expect(result, `obsidian failure: ${describeResult(result)}`).toEqual({ ok: true });
  });

  test("docusaurus flavor preserves representative samples", async ({ mount, page }) => {
    await mount(<RoundtripFixture />);
    const result = await runRoundtripInBrowser(page, "docusaurus", docusaurusSamples);
    expect(result, `docusaurus failure: ${describeResult(result)}`).toEqual({ ok: true });
  });

  test("pandoc flavor preserves representative samples", async ({ mount, page }) => {
    await mount(<RoundtripFixture />);
    const result = await runRoundtripInBrowser(page, "pandoc", pandocSamples);
    expect(result, `pandoc failure: ${describeResult(result)}`).toEqual({ ok: true });
  });
});
