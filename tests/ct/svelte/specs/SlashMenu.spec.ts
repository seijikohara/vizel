import { test } from "@playwright/experimental-ct-svelte";
import {
  testSlashMenuAppears,
  testSlashMenuBlockquote,
  testSlashMenuBulletList,
  testSlashMenuCodeBlock,
  testSlashMenuEmptyState,
  testSlashMenuEscape,
  testSlashMenuFiltering,
  testSlashMenuHeading,
  testSlashMenuKeyboardNavigation,
  testSlashMenuOrderedList,
} from "../../scenarios/slash-menu.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("SlashMenu - Svelte", () => {
  test("appears when typing /", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuAppears(component, page);
  });

  test("hides when pressing Escape", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuEscape(component, page);
  });

  test("filters items when typing", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuFiltering(component, page);
  });

  test("inserts heading", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuHeading(component, page);
  });

  test("inserts bullet list", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuBulletList(component, page);
  });

  test("inserts ordered list", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuOrderedList(component, page);
  });

  test("inserts code block", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuCodeBlock(component, page);
  });

  test("inserts blockquote", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuBlockquote(component, page);
  });

  test("supports keyboard navigation", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuKeyboardNavigation(component, page);
  });

  test("shows empty state when no items match", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testSlashMenuEmptyState(component, page);
  });
});
