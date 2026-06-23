import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
} from "../../scenarios/slash-menu-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("SlashMenu (Vitest Browser) - React", () => {
  test("appears when typing /", async () => {
    await render(<EditorFixture />);
    await testSlashMenuAppears(page.elementLocator(document.body));
  });

  test("hides when pressing Escape", async () => {
    await render(<EditorFixture />);
    await testSlashMenuEscape(page.elementLocator(document.body));
  });

  test("filters items when typing", async () => {
    await render(<EditorFixture />);
    await testSlashMenuFiltering(page.elementLocator(document.body));
  });

  test("inserts heading", async () => {
    await render(<EditorFixture />);
    await testSlashMenuHeading(page.elementLocator(document.body));
  });

  test("inserts bullet list", async () => {
    await render(<EditorFixture />);
    await testSlashMenuBulletList(page.elementLocator(document.body));
  });

  test("inserts ordered list", async () => {
    await render(<EditorFixture />);
    await testSlashMenuOrderedList(page.elementLocator(document.body));
  });

  test("inserts task list", async () => {
    await render(<EditorFixture />);
    await testSlashMenuTaskList(page.elementLocator(document.body));
  });

  test("inserts code block", async () => {
    await render(<EditorFixture />);
    await testSlashMenuCodeBlock(page.elementLocator(document.body));
  });

  test("inserts blockquote", async () => {
    await render(<EditorFixture />);
    await testSlashMenuBlockquote(page.elementLocator(document.body));
  });

  test("supports keyboard navigation", async () => {
    await render(<EditorFixture />);
    await testSlashMenuKeyboardNavigation(page.elementLocator(document.body));
  });

  test("shows empty state when no items match", async () => {
    await render(<EditorFixture />);
    await testSlashMenuEmptyState(page.elementLocator(document.body));
  });

  test("displays group headers", async () => {
    await render(<EditorFixture />);
    await testSlashMenuGroupHeaders(page.elementLocator(document.body));
  });

  test("displays keyboard shortcuts", async () => {
    await render(<EditorFixture />);
    await testSlashMenuShortcuts(page.elementLocator(document.body));
  });

  test("Tab key navigates between groups", async () => {
    await render(<EditorFixture />);
    await testSlashMenuTabNavigation(page.elementLocator(document.body));
  });

  test("fuzzy search by keywords", async () => {
    await render(<EditorFixture />);
    await testSlashMenuKeywordSearch(page.elementLocator(document.body));
  });

  test("fuzzy search partial matching", async () => {
    await render(<EditorFixture />);
    await testSlashMenuFuzzySearch(page.elementLocator(document.body));
  });
});
