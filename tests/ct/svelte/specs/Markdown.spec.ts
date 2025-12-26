import { test } from "@playwright/experimental-ct-svelte";
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

test.describe("Markdown - Svelte", () => {
  test("exports editor content as markdown", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownExport(component, page);
  });

  test("imports markdown content", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownImport(component, page);
  });

  test("preserves heading structure", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownHeading(component, page);
  });

  test("handles bullet lists correctly", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownList(component, page);
  });

  test("handles code blocks", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownCodeBlock(component, page);
  });

  test("handles links correctly", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownLink(component, page);
  });

  test("handles italic text", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownItalic(component, page);
  });

  test("handles strikethrough text", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownStrikethrough(component, page);
  });

  test("handles inline code", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownInlineCode(component, page);
  });

  test("handles images", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownImage(component, page);
  });

  test("handles ordered lists", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownOrderedList(component, page);
  });

  test("handles blockquotes", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownBlockquote(component, page);
  });

  test("handles horizontal rules", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownHorizontalRule(component, page);
  });

  test("handles tables", async ({ mount, page }) => {
    const component = await mount(MarkdownFixture);
    await testMarkdownTable(component, page);
  });
});
