import { test } from "@playwright/experimental-ct-react";
import {
  testDividerInSlashMenu,
  testHorizontalRuleDelete,
  testHorizontalRuleSelection,
  testHorizontalRuleViaAsterisks,
  testHorizontalRuleViaHyphens,
  testHorizontalRuleViaSlashCommand,
  testHorizontalRuleViaUnderscores,
} from "../../scenarios/horizontal-rule.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("HorizontalRule - React", () => {
  test("can be inserted via slash command", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleViaSlashCommand(component, page);
  });

  test("can be inserted via --- input rule", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleViaHyphens(component, page);
  });

  test("can be inserted via *** + space input rule", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleViaAsterisks(component, page);
  });

  test("can be inserted via ___ + space input rule", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleViaUnderscores(component, page);
  });

  test("can be selected", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleSelection(component, page);
  });

  test("can be deleted with backspace", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testHorizontalRuleDelete(component, page);
  });

  test("divider appears in slash menu", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testDividerInSlashMenu(component, page);
  });
});
