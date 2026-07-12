import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { page } from "vitest/browser";

import {
  testSlashMenuAppears,
  testSlashMenuBlockquote,
  testSlashMenuBulletList,
  testSlashMenuCodeBlock,
  testSlashMenuEmptyState,
  testSlashMenuEscape,
  testSlashMenuFiltering,
  testSlashMenuFuzzySearch,
  testSlashMenuGroupHeaders,
  testSlashMenuHeading,
  testSlashMenuKeyboardNavigation,
  testSlashMenuKeywordSearch,
  testSlashMenuOrderedList,
  testSlashMenuShortcuts,
  testSlashMenuTabNavigation,
  testSlashMenuTaskList,
} from "../../scenarios/slash-menu.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("SlashMenu (Vitest Browser) - Svelte", () => {
  test("appears when typing /", async () => {
    render(EditorFixture);
    await testSlashMenuAppears(page.elementLocator(document.body));
  });

  test("hides when pressing Escape", async () => {
    render(EditorFixture);
    await testSlashMenuEscape(page.elementLocator(document.body));
  });

  test("filters items when typing", async () => {
    render(EditorFixture);
    await testSlashMenuFiltering(page.elementLocator(document.body));
  });

  test("inserts heading", async () => {
    render(EditorFixture);
    await testSlashMenuHeading(page.elementLocator(document.body));
  });

  test("inserts bullet list", async () => {
    render(EditorFixture);
    await testSlashMenuBulletList(page.elementLocator(document.body));
  });

  test("inserts ordered list", async () => {
    render(EditorFixture);
    await testSlashMenuOrderedList(page.elementLocator(document.body));
  });

  test("inserts task list", async () => {
    render(EditorFixture);
    await testSlashMenuTaskList(page.elementLocator(document.body));
  });

  test("inserts code block", async () => {
    render(EditorFixture);
    await testSlashMenuCodeBlock(page.elementLocator(document.body));
  });

  test("inserts blockquote", async () => {
    render(EditorFixture);
    await testSlashMenuBlockquote(page.elementLocator(document.body));
  });

  test("supports keyboard navigation", async () => {
    render(EditorFixture);
    await testSlashMenuKeyboardNavigation(page.elementLocator(document.body));
  });

  test("shows empty state when no items match", async () => {
    render(EditorFixture);
    await testSlashMenuEmptyState(page.elementLocator(document.body));
  });

  test("displays group headers", async () => {
    render(EditorFixture);
    await testSlashMenuGroupHeaders(page.elementLocator(document.body));
  });

  test("displays keyboard shortcuts", async () => {
    render(EditorFixture);
    await testSlashMenuShortcuts(page.elementLocator(document.body));
  });

  test("Tab key navigates between groups", async () => {
    render(EditorFixture);
    await testSlashMenuTabNavigation(page.elementLocator(document.body));
  });

  test("fuzzy search by keywords", async () => {
    render(EditorFixture);
    await testSlashMenuKeywordSearch(page.elementLocator(document.body));
  });

  test("fuzzy search partial matching", async () => {
    render(EditorFixture);
    await testSlashMenuFuzzySearch(page.elementLocator(document.body));
  });
});
