import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { isFirefox } from "../../scenarios/_vitest-context";
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
import { EditorFixture } from "./EditorFixture";
import { MarkdownFixture } from "./MarkdownFixture";

describe("Edge Cases (Vitest Browser) - React", () => {
  describe("Empty State", () => {
    test("empty editor has correct initial state", async () => {
      await render(<EditorFixture />);
      await testEditorEmptyState(page.elementLocator(document.body));
    });

    test("empty editor markdown export produces empty output", async () => {
      await render(<MarkdownFixture />);
      await testMarkdownEmptyExport(page.elementLocator(document.body));
    });
  });

  describe("Special Characters", () => {
    // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
    test.skipIf(isFirefox)("handles Unicode and emoji characters", async () => {
      await render(<EditorFixture />);
      await testSpecialCharacters(page.elementLocator(document.body));
    });

    test("escapes HTML-like characters", async () => {
      await render(<EditorFixture />);
      await testHtmlEscaping(page.elementLocator(document.body));
    });
  });

  describe("Undo/Redo", () => {
    test("undo/redo works across formatting operations", async () => {
      await render(<EditorFixture />);
      await testUndoRedoFormatting(page.elementLocator(document.body));
    });

    test("undo works across multiple operation types", async () => {
      await render(<EditorFixture />);
      await testUndoMultipleOperations(page.elementLocator(document.body));
    });
  });

  describe("Rapid Operations", () => {
    test("rapid formatting toggles do not corrupt state", async () => {
      await render(<EditorFixture />);
      await testRapidFormattingToggles(page.elementLocator(document.body));
    });
  });

  describe("Markdown Edge Cases", () => {
    // Firefox ignores synthesized ClipboardEvent payloads (see _vitest-context).
    test.skipIf(isFirefox)("markdown export preserves special characters", async () => {
      await render(<MarkdownFixture />);
      await testMarkdownSpecialCharsExport(page.elementLocator(document.body));
    });

    test("markdown import handles nested content", async () => {
      await render(<MarkdownFixture />);
      await testMarkdownNestedContent(page.elementLocator(document.body));
    });
  });
});
