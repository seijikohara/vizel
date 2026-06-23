import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testCalloutCommonmarkOutput,
  testCalloutDocusaurusOutput,
  testCalloutGfmOutput,
  testCalloutObsidianOutput,
  testCalloutParseDocusaurus,
  testCalloutParseGfm,
  testCalloutParseObsidian,
  testCalloutRoundtrip,
} from "../../scenarios/markdown-flavors-bc.scenario";
import MarkdownFlavorsFixture from "./MarkdownFlavorsFixture.svelte";

describe("Markdown Flavors (Vitest Browser) - Svelte", () => {
  describe("Callout output by flavor", () => {
    test("GFM flavor serializes callout as > [!NOTE]", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "gfm" } });
      await testCalloutGfmOutput(page.elementLocator(document.body));
    });

    test("Obsidian flavor serializes callout as > [!info]", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "obsidian" } });
      await testCalloutObsidianOutput(page.elementLocator(document.body));
    });

    test("Docusaurus flavor serializes callout as :::info", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "docusaurus" } });
      await testCalloutDocusaurusOutput(page.elementLocator(document.body));
    });

    test("CommonMark flavor serializes callout as > **Info**: content", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "commonmark" } });
      await testCalloutCommonmarkOutput(page.elementLocator(document.body));
    });
  });

  describe("Tolerant input parsing", () => {
    test("parses GFM-style callout regardless of flavor", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "docusaurus" } });
      await testCalloutParseGfm(page.elementLocator(document.body));
    });

    test("parses Obsidian-style callout regardless of flavor", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "gfm" } });
      await testCalloutParseObsidian(page.elementLocator(document.body));
    });

    test("parses Docusaurus-style callout regardless of flavor", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "obsidian" } });
      await testCalloutParseDocusaurus(page.elementLocator(document.body));
    });
  });

  describe("Roundtrip", () => {
    test("GFM roundtrip: import any format, export as GFM", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "gfm" } });
      await testCalloutRoundtrip(/> \[!NOTE\]/);
    });

    test("Obsidian roundtrip: import any format, export as Obsidian", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "obsidian" } });
      // Obsidian maps the "info" callout type to "note" on output; accept both.
      await testCalloutRoundtrip(/> \[!(?:note|info)\]/);
    });

    test("Docusaurus roundtrip: import any format, export as directives", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "docusaurus" } });
      await testCalloutRoundtrip(/:::(?:note|info)/);
    });

    test("CommonMark roundtrip: import any format, export as blockquote", async () => {
      render(MarkdownFlavorsFixture, { props: { flavor: "commonmark" } });
      await testCalloutRoundtrip(/> \*\*(?:Note|Info)\*\*:/);
    });
  });
});
