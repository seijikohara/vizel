import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
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
} from "../../scenarios/edge-cases-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";
import MarkdownFixture from "./MarkdownFixture.svelte";

describe("Edge Cases (Vitest Browser) - Svelte", () => {
  describe("Empty State", () => {
    test("empty editor has correct initial state", async () => {
      render(EditorFixture);
      await testEditorEmptyState(page.elementLocator(document.body));
    });

    test("empty editor markdown export produces empty output", async () => {
      render(MarkdownFixture);
      await testMarkdownEmptyExport(page.elementLocator(document.body));
    });
  });

  describe("Special Characters", () => {
    test("handles Unicode and emoji characters", async () => {
      render(EditorFixture);
      await testSpecialCharacters(page.elementLocator(document.body));
    });

    test("escapes HTML-like characters", async () => {
      render(EditorFixture);
      await testHtmlEscaping(page.elementLocator(document.body));
    });
  });

  describe("Undo/Redo", () => {
    test("undo/redo works across formatting operations", async () => {
      render(EditorFixture);
      await testUndoRedoFormatting(page.elementLocator(document.body));
    });

    test("undo works across multiple operation types", async () => {
      render(EditorFixture);
      await testUndoMultipleOperations(page.elementLocator(document.body));
    });
  });

  describe("Rapid Operations", () => {
    test("rapid formatting toggles do not corrupt state", async () => {
      render(EditorFixture);
      await testRapidFormattingToggles(page.elementLocator(document.body));
    });
  });

  describe("Markdown Edge Cases", () => {
    test("markdown export preserves special characters", async () => {
      render(MarkdownFixture);
      await testMarkdownSpecialCharsExport(page.elementLocator(document.body));
    });

    test("markdown import handles nested content", async () => {
      render(MarkdownFixture);
      await testMarkdownNestedContent(page.elementLocator(document.body));
    });
  });
});
