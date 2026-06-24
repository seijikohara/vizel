import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import {
  testBlockMenuAccessibility,
  testBlockMenuClosesOnEscape,
  testBlockMenuClosesOnOutsideClick,
  testBlockMenuDefaultActions,
  testBlockMenuDeleteAction,
  testBlockMenuDuplicateAction,
  testBlockMenuOpensOnClick,
  testBlockMenuTurnIntoHeading,
  testBlockMenuTurnIntoSubmenu,
} from "../../scenarios/block-menu.scenario";
import VizelFixture from "./VizelFixture.vue";

describe("BlockMenu (Vitest Browser) - Vue", () => {
  test("opens block menu on drag handle click", async () => {
    render(VizelFixture);
    await testBlockMenuOpensOnClick(page.elementLocator(document.body));
  });

  test("closes on Escape key", async () => {
    render(VizelFixture);
    await testBlockMenuClosesOnEscape(page.elementLocator(document.body));
  });

  test("closes on outside click", async () => {
    render(VizelFixture);
    await testBlockMenuClosesOnOutsideClick(page.elementLocator(document.body));
  });

  test("shows default actions", async () => {
    render(VizelFixture);
    await testBlockMenuDefaultActions(page.elementLocator(document.body));
  });

  test("has correct accessibility attributes", async () => {
    render(VizelFixture);
    await testBlockMenuAccessibility(page.elementLocator(document.body));
  });

  test("Delete removes the block", async () => {
    render(VizelFixture);
    await testBlockMenuDeleteAction(page.elementLocator(document.body));
  });

  test("Duplicate copies the block", async () => {
    render(VizelFixture);
    await testBlockMenuDuplicateAction(page.elementLocator(document.body));
  });

  test("shows Turn into submenu", async () => {
    render(VizelFixture);
    await testBlockMenuTurnIntoSubmenu(page.elementLocator(document.body));
  });

  test("converts block to heading", async () => {
    render(VizelFixture);
    await testBlockMenuTurnIntoHeading(page.elementLocator(document.body));
  });
});
