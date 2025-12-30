import { test } from "@playwright/experimental-ct-vue";
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
import EditorFixture from "./EditorFixture.vue";

test.describe("CodeBlock - Vue", () => {
  test("can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockInsert(component, page);
  });

  test("has language selector", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockHasLanguageSelector(component, page);
  });

  test("language can be changed", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockLanguageChange(component, page);
  });

  test("Enter key in language input does not add newline", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockLanguageInputEnterKey(component, page);
  });

  test("has line numbers toggle button", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockHasLineNumbersToggle(component, page);
  });

  test("line numbers can be toggled", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockLineNumbersToggle(component, page);
  });

  test("can type code in code block", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockTyping(component, page);
  });

  test("applies syntax highlighting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testCodeBlockSyntaxHighlighting(component, page);
  });
});
