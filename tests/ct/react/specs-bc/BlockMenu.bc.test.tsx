import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
} from "../../scenarios/block-menu-bc.scenario";
import { VizelFixture } from "./VizelFixture";

describe("BlockMenu (Vitest Browser) - React", () => {
  test("opens block menu on drag handle click", async () => {
    await render(<VizelFixture />);
    await testBlockMenuOpensOnClick(page.elementLocator(document.body));
  });

  test("closes on Escape key", async () => {
    await render(<VizelFixture />);
    await testBlockMenuClosesOnEscape(page.elementLocator(document.body));
  });

  test("closes on outside click", async () => {
    await render(<VizelFixture />);
    await testBlockMenuClosesOnOutsideClick(page.elementLocator(document.body));
  });

  test("shows default actions", async () => {
    await render(<VizelFixture />);
    await testBlockMenuDefaultActions(page.elementLocator(document.body));
  });

  test("has correct accessibility attributes", async () => {
    await render(<VizelFixture />);
    await testBlockMenuAccessibility(page.elementLocator(document.body));
  });

  test("Delete removes the block", async () => {
    await render(<VizelFixture />);
    await testBlockMenuDeleteAction(page.elementLocator(document.body));
  });

  test("Duplicate copies the block", async () => {
    await render(<VizelFixture />);
    await testBlockMenuDuplicateAction(page.elementLocator(document.body));
  });

  test("shows Turn into submenu", async () => {
    await render(<VizelFixture />);
    await testBlockMenuTurnIntoSubmenu(page.elementLocator(document.body));
  });

  test("converts block to heading", async () => {
    await render(<VizelFixture />);
    await testBlockMenuTurnIntoHeading(page.elementLocator(document.body));
  });
});
