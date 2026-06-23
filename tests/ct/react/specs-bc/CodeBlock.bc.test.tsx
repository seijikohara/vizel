import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testCodeBlockHasLanguageSelector,
  testCodeBlockHasLineNumbersToggle,
  testCodeBlockInsert,
  testCodeBlockLanguageChange,
  testCodeBlockLanguageInputEnterKey,
  testCodeBlockLineNumbersToggle,
  testCodeBlockSyntaxHighlighting,
  testCodeBlockTyping,
} from "../../scenarios/code-block-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("CodeBlock (Vitest Browser) - React", () => {
  test("can be inserted via slash command", async () => {
    await render(<EditorFixture />);
    await testCodeBlockInsert(page.elementLocator(document.body));
  });

  test("has language selector", async () => {
    await render(<EditorFixture />);
    await testCodeBlockHasLanguageSelector(page.elementLocator(document.body));
  });

  test("language can be changed", async () => {
    await render(<EditorFixture />);
    await testCodeBlockLanguageChange(page.elementLocator(document.body));
  });

  test("Enter key in language input does not add newline", async () => {
    await render(<EditorFixture />);
    await testCodeBlockLanguageInputEnterKey(page.elementLocator(document.body));
  });

  test("has line numbers toggle button", async () => {
    await render(<EditorFixture />);
    await testCodeBlockHasLineNumbersToggle(page.elementLocator(document.body));
  });

  test("line numbers can be toggled", async () => {
    await render(<EditorFixture />);
    await testCodeBlockLineNumbersToggle(page.elementLocator(document.body));
  });

  test("can type code in code block", async () => {
    await render(<EditorFixture />);
    await testCodeBlockTyping(page.elementLocator(document.body));
  });

  test("applies syntax highlighting", async () => {
    await render(<EditorFixture />);
    await testCodeBlockSyntaxHighlighting(page.elementLocator(document.body));
  });
});
