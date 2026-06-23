import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
import { MarkdownFlavorsFixture } from "./MarkdownFlavorsFixture";

describe("Markdown Flavors (Vitest Browser) - React", () => {
  describe("Callout output by flavor", () => {
    test("GFM flavor serializes callout as > [!NOTE]", async () => {
      await render(<MarkdownFlavorsFixture flavor="gfm" />);
      await testCalloutGfmOutput(page.elementLocator(document.body));
    });

    test("Obsidian flavor serializes callout as > [!info]", async () => {
      await render(<MarkdownFlavorsFixture flavor="obsidian" />);
      await testCalloutObsidianOutput(page.elementLocator(document.body));
    });

    test("Docusaurus flavor serializes callout as :::info", async () => {
      await render(<MarkdownFlavorsFixture flavor="docusaurus" />);
      await testCalloutDocusaurusOutput(page.elementLocator(document.body));
    });

    test("CommonMark flavor serializes callout as > **Info**: content", async () => {
      await render(<MarkdownFlavorsFixture flavor="commonmark" />);
      await testCalloutCommonmarkOutput(page.elementLocator(document.body));
    });
  });

  describe("Tolerant input parsing", () => {
    test("parses GFM-style callout regardless of flavor", async () => {
      await render(<MarkdownFlavorsFixture flavor="docusaurus" />);
      await testCalloutParseGfm(page.elementLocator(document.body));
    });

    test("parses Obsidian-style callout regardless of flavor", async () => {
      await render(<MarkdownFlavorsFixture flavor="gfm" />);
      await testCalloutParseObsidian(page.elementLocator(document.body));
    });

    test("parses Docusaurus-style callout regardless of flavor", async () => {
      await render(<MarkdownFlavorsFixture flavor="obsidian" />);
      await testCalloutParseDocusaurus(page.elementLocator(document.body));
    });
  });

  describe("Roundtrip", () => {
    test("GFM roundtrip: import any format, export as GFM", async () => {
      await render(<MarkdownFlavorsFixture flavor="gfm" />);
      await testCalloutRoundtrip(/> \[!NOTE\]/);
    });

    test("Obsidian roundtrip: import any format, export as Obsidian", async () => {
      await render(<MarkdownFlavorsFixture flavor="obsidian" />);
      // Obsidian maps the "info" callout type to "note" on output; accept both.
      await testCalloutRoundtrip(/> \[!(?:note|info)\]/);
    });

    test("Docusaurus roundtrip: import any format, export as directives", async () => {
      await render(<MarkdownFlavorsFixture flavor="docusaurus" />);
      await testCalloutRoundtrip(/:::(?:note|info)/);
    });

    test("CommonMark roundtrip: import any format, export as blockquote", async () => {
      await render(<MarkdownFlavorsFixture flavor="commonmark" />);
      await testCalloutRoundtrip(/> \*\*(?:Note|Info)\*\*:/);
    });
  });
});
