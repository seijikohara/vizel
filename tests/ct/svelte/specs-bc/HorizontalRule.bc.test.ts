import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testDividerInSlashMenu,
  testHorizontalRuleDelete,
  testHorizontalRuleSelection,
  testHorizontalRuleViaAsterisks,
  testHorizontalRuleViaHyphens,
  testHorizontalRuleViaSlashCommand,
  testHorizontalRuleViaUnderscores,
} from "../../scenarios/horizontal-rule-bc.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("HorizontalRule (Vitest Browser) - Svelte", () => {
  test("can be inserted via slash command", async () => {
    render(EditorFixture);
    await testHorizontalRuleViaSlashCommand(page.elementLocator(document.body));
  });

  test("can be inserted via --- input rule", async () => {
    render(EditorFixture);
    await testHorizontalRuleViaHyphens(page.elementLocator(document.body));
  });

  test("can be inserted via *** + space input rule", async () => {
    render(EditorFixture);
    await testHorizontalRuleViaAsterisks(page.elementLocator(document.body));
  });

  test("can be inserted via ___ + space input rule", async () => {
    render(EditorFixture);
    await testHorizontalRuleViaUnderscores(page.elementLocator(document.body));
  });

  test("can be selected", async () => {
    render(EditorFixture);
    await testHorizontalRuleSelection(page.elementLocator(document.body));
  });

  test("can be deleted with backspace", async () => {
    render(EditorFixture);
    await testHorizontalRuleDelete(page.elementLocator(document.body));
  });

  test("divider appears in slash menu", async () => {
    render(EditorFixture);
    await testDividerInSlashMenu(page.elementLocator(document.body));
  });
});
