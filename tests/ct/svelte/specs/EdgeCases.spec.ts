import { test } from "@playwright/experimental-ct-svelte";
import {
  testEditorEmptyState,
  testHtmlEscaping,
  testMarkdownEmptyExport,
  testMarkdownNestedContent,
  testMarkdownSpecialCharsExport,
  testRapidFormattingToggles,
  testSpecialCharacters,
  testUndoMultipleOperations,
  testUndoRedoFormatting,
} from "../../scenarios/edge-cases.scenario";
import EditorFixture from "./EditorFixture.svelte";
import MarkdownFixture from "./MarkdownFixture.svelte";

test.describe("Edge Cases - Svelte", () => {
  test.describe("Empty State", () => {
    test("empty editor has correct initial state", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testEditorEmptyState(component, page);
    });

    test("empty editor markdown export produces empty output", async ({ mount, page }) => {
      const component = await mount(MarkdownFixture);
      await testMarkdownEmptyExport(component, page);
    });
  });

  test.describe("Special Characters", () => {
    test("handles Unicode and emoji characters", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testSpecialCharacters(component, page);
    });

    test("escapes HTML-like characters", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testHtmlEscaping(component, page);
    });
  });

  test.describe("Undo/Redo", () => {
    test("undo/redo works across formatting operations", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testUndoRedoFormatting(component, page);
    });

    test("undo works across multiple operation types", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testUndoMultipleOperations(component, page);
    });
  });

  test.describe("Rapid Operations", () => {
    test("rapid formatting toggles do not corrupt state", async ({ mount, page }) => {
      const component = await mount(EditorFixture);
      await testRapidFormattingToggles(component, page);
    });
  });

  test.describe("Markdown Edge Cases", () => {
    test("markdown export preserves special characters", async ({ mount, page }) => {
      const component = await mount(MarkdownFixture);
      await testMarkdownSpecialCharsExport(component, page);
    });

    test("markdown import handles nested content", async ({ mount, page }) => {
      const component = await mount(MarkdownFixture);
      await testMarkdownNestedContent(component, page);
    });
  });
});
