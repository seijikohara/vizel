import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testDividerInSlashMenu,
  testHorizontalRuleDelete,
  testHorizontalRuleSelection,
  testHorizontalRuleViaAsterisks,
  testHorizontalRuleViaHyphens,
  testHorizontalRuleViaSlashCommand,
  testHorizontalRuleViaUnderscores,
} from "../../scenarios/horizontal-rule-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("HorizontalRule (Vitest Browser) - React", () => {
  test("can be inserted via slash command", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleViaSlashCommand(page.elementLocator(document.body));
  });

  test("can be inserted via --- input rule", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleViaHyphens(page.elementLocator(document.body));
  });

  test("can be inserted via *** + space input rule", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleViaAsterisks(page.elementLocator(document.body));
  });

  test("can be inserted via ___ + space input rule", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleViaUnderscores(page.elementLocator(document.body));
  });

  test("can be selected", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleSelection(page.elementLocator(document.body));
  });

  test("can be deleted with backspace", async () => {
    await render(<EditorFixture />);
    await testHorizontalRuleDelete(page.elementLocator(document.body));
  });

  test("divider appears in slash menu", async () => {
    await render(<EditorFixture />);
    await testDividerInSlashMenu(page.elementLocator(document.body));
  });
});
