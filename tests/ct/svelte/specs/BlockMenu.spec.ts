import { test } from "@playwright/experimental-ct-svelte";
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
import VizelFixture from "./VizelFixture.svelte";

test.describe("BlockMenu - Svelte", () => {
  test.describe("Opening and Closing", () => {
    test("opens block menu on drag handle click", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuOpensOnClick(component, page);
    });

    test("closes on Escape key", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuClosesOnEscape(component, page);
    });

    test("closes on outside click", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuClosesOnOutsideClick(component, page);
    });
  });

  test.describe("Menu Content", () => {
    test("shows default actions", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuDefaultActions(component, page);
    });

    test("has correct accessibility attributes", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuAccessibility(component, page);
    });
  });

  test.describe("Actions", () => {
    test("Delete removes the block", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuDeleteAction(component, page);
    });

    test("Duplicate copies the block", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuDuplicateAction(component, page);
    });
  });

  test.describe("Turn Into", () => {
    test("shows Turn into submenu", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuTurnIntoSubmenu(component, page);
    });

    test("converts block to heading", async ({ mount, page }) => {
      const component = await mount(VizelFixture);
      await testBlockMenuTurnIntoHeading(component, page);
    });
  });
});
