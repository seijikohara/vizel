import { test } from "@playwright/experimental-ct-svelte";
import {
  testCalloutCommonmarkOutput,
  testCalloutDocusaurusOutput,
  testCalloutGfmOutput,
  testCalloutObsidianOutput,
  testCalloutParseDocusaurus,
  testCalloutParseGfm,
  testCalloutParseObsidian,
  testCalloutRoundtrip,
} from "../../scenarios/markdown-flavors.scenario";
import MarkdownFlavorsFixture from "./MarkdownFlavorsFixture.svelte";

test.describe("Markdown Flavors - Svelte", () => {
  test.describe("Callout output by flavor", () => {
    test("GFM flavor serializes callout as > [!NOTE]", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "gfm" },
      });
      await testCalloutGfmOutput(component, page);
    });

    test("Obsidian flavor serializes callout as > [!info]", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "obsidian" },
      });
      await testCalloutObsidianOutput(component, page);
    });

    test("Docusaurus flavor serializes callout as :::info", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "docusaurus" },
      });
      await testCalloutDocusaurusOutput(component, page);
    });

    test("CommonMark flavor serializes callout as > **Info**: content", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "commonmark" },
      });
      await testCalloutCommonmarkOutput(component, page);
    });
  });

  test.describe("Tolerant input parsing", () => {
    test("parses GFM-style callout regardless of flavor", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "docusaurus" },
      });
      await testCalloutParseGfm(component, page);
    });

    test("parses Obsidian-style callout regardless of flavor", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "gfm" },
      });
      await testCalloutParseObsidian(component, page);
    });

    test("parses Docusaurus-style callout regardless of flavor", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "obsidian" },
      });
      await testCalloutParseDocusaurus(component, page);
    });
  });

  test.describe("Roundtrip", () => {
    test("GFM roundtrip: import any format, export as GFM", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "gfm" },
      });
      await testCalloutRoundtrip(component, page, /> \[!NOTE\]/);
    });

    test("Obsidian roundtrip: import any format, export as Obsidian", async ({ mount, page }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "obsidian" },
      });
      await testCalloutRoundtrip(component, page, /> \[!(?:note|info)\]/);
    });

    test("Docusaurus roundtrip: import any format, export as directives", async ({
      mount,
      page,
    }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "docusaurus" },
      });
      await testCalloutRoundtrip(component, page, /:::(?:note|info)/);
    });

    test("CommonMark roundtrip: import any format, export as blockquote", async ({
      mount,
      page,
    }) => {
      const component = await mount(MarkdownFlavorsFixture, {
        props: { flavor: "commonmark" },
      });
      await testCalloutRoundtrip(component, page, /> \*\*(?:Note|Info)\*\*:/);
    });
  });
});
