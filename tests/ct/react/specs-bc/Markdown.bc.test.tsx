import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
} from "../../scenarios/markdown-bc.scenario";
import { MarkdownFixture } from "./MarkdownFixture";

describe("Markdown (Vitest Browser) - React", () => {
  test("exports editor content as markdown", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownExport(page.elementLocator(document.body));
  });

  test("imports markdown content", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownImport(page.elementLocator(document.body));
  });

  test("preserves heading structure", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownHeading(page.elementLocator(document.body));
  });

  test("handles bullet lists correctly", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownList(page.elementLocator(document.body));
  });

  test("handles code blocks", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownCodeBlock(page.elementLocator(document.body));
  });

  test("handles links correctly", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownLink(page.elementLocator(document.body));
  });

  test("handles italic text", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownItalic(page.elementLocator(document.body));
  });

  test("handles strikethrough text", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownStrikethrough(page.elementLocator(document.body));
  });

  test("handles inline code", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownInlineCode(page.elementLocator(document.body));
  });

  test("handles images", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownImage(page.elementLocator(document.body));
  });

  test("handles ordered lists", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownOrderedList(page.elementLocator(document.body));
  });

  test("handles blockquotes", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownBlockquote(page.elementLocator(document.body));
  });

  test("handles horizontal rules", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownHorizontalRule(page.elementLocator(document.body));
  });

  test("handles tables", async () => {
    await render(<MarkdownFixture />);
    await testMarkdownTable(page.elementLocator(document.body));
  });
});
