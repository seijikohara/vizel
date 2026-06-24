import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testMarkdownBlockquote,
  testMarkdownCodeBlock,
  testMarkdownExport,
  testMarkdownHeading,
  testMarkdownHorizontalRule,
  testMarkdownImage,
  testMarkdownImport,
  testMarkdownInlineCode,
  testMarkdownItalic,
  testMarkdownLink,
  testMarkdownList,
  testMarkdownOrderedList,
  testMarkdownStrikethrough,
  testMarkdownTable,
} from "../../scenarios/markdown.scenario";
import MarkdownFixture from "./MarkdownFixture.svelte";

describe("Markdown (Vitest Browser) - Svelte", () => {
  test("exports editor content as markdown", async () => {
    render(MarkdownFixture);
    await testMarkdownExport(page.elementLocator(document.body));
  });

  test("imports markdown content", async () => {
    render(MarkdownFixture);
    await testMarkdownImport(page.elementLocator(document.body));
  });

  test("preserves heading structure", async () => {
    render(MarkdownFixture);
    await testMarkdownHeading(page.elementLocator(document.body));
  });

  test("handles bullet lists correctly", async () => {
    render(MarkdownFixture);
    await testMarkdownList(page.elementLocator(document.body));
  });

  test("handles code blocks", async () => {
    render(MarkdownFixture);
    await testMarkdownCodeBlock(page.elementLocator(document.body));
  });

  test("handles links correctly", async () => {
    render(MarkdownFixture);
    await testMarkdownLink(page.elementLocator(document.body));
  });

  test("handles italic text", async () => {
    render(MarkdownFixture);
    await testMarkdownItalic(page.elementLocator(document.body));
  });

  test("handles strikethrough text", async () => {
    render(MarkdownFixture);
    await testMarkdownStrikethrough(page.elementLocator(document.body));
  });

  test("handles inline code", async () => {
    render(MarkdownFixture);
    await testMarkdownInlineCode(page.elementLocator(document.body));
  });

  test("handles images", async () => {
    render(MarkdownFixture);
    await testMarkdownImage(page.elementLocator(document.body));
  });

  test("handles ordered lists", async () => {
    render(MarkdownFixture);
    await testMarkdownOrderedList(page.elementLocator(document.body));
  });

  test("handles blockquotes", async () => {
    render(MarkdownFixture);
    await testMarkdownBlockquote(page.elementLocator(document.body));
  });

  test("handles horizontal rules", async () => {
    render(MarkdownFixture);
    await testMarkdownHorizontalRule(page.elementLocator(document.body));
  });

  test("handles tables", async () => {
    render(MarkdownFixture);
    await testMarkdownTable(page.elementLocator(document.body));
  });
});
