import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testCodeBlockHasLanguageSelector,
  testCodeBlockHasLineNumbersToggle,
  testCodeBlockInsert,
  testCodeBlockLanguageChange,
  testCodeBlockLanguageInputEnterKey,
  testCodeBlockLineNumbersToggle,
  testCodeBlockSyntaxHighlighting,
  testCodeBlockTyping,
} from "../../scenarios/code-block.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("CodeBlock (Vitest Browser) - Svelte", () => {
  test("can be inserted via slash command", async () => {
    render(EditorFixture);
    await testCodeBlockInsert(page.elementLocator(document.body));
  });

  test("has language selector", async () => {
    render(EditorFixture);
    await testCodeBlockHasLanguageSelector(page.elementLocator(document.body));
  });

  test("language can be changed", async () => {
    render(EditorFixture);
    await testCodeBlockLanguageChange(page.elementLocator(document.body));
  });

  test("Enter key in language input does not add newline", async () => {
    render(EditorFixture);
    await testCodeBlockLanguageInputEnterKey(page.elementLocator(document.body));
  });

  test("has line numbers toggle button", async () => {
    render(EditorFixture);
    await testCodeBlockHasLineNumbersToggle(page.elementLocator(document.body));
  });

  test("line numbers can be toggled", async () => {
    render(EditorFixture);
    await testCodeBlockLineNumbersToggle(page.elementLocator(document.body));
  });

  test("can type code in code block", async () => {
    render(EditorFixture);
    await testCodeBlockTyping(page.elementLocator(document.body));
  });

  test("applies syntax highlighting", async () => {
    render(EditorFixture);
    await testCodeBlockSyntaxHighlighting(page.elementLocator(document.body));
  });
});
