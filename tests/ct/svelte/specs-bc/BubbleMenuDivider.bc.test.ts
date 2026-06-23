import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import {
  testDividerAcceptsCustomClass,
  testDividerIsSpanElement,
  testDividerRendersWithBaseClass,
} from "../../scenarios/bubble-menu-divider-bc.scenario";
import BubbleMenuDividerFixture from "./BubbleMenuDividerFixture.svelte";

describe("BubbleMenuDivider (Vitest Browser) - Svelte", () => {
  test("renders with base class", async () => {
    render(BubbleMenuDividerFixture);
    await testDividerRendersWithBaseClass(page.elementLocator(document.body));
  });

  test("accepts custom class", async () => {
    render(BubbleMenuDividerFixture, { props: { class: "custom-divider" } });
    await testDividerAcceptsCustomClass(page.elementLocator(document.body));
  });

  test("renders as span element", async () => {
    render(BubbleMenuDividerFixture);
    await testDividerIsSpanElement(page.elementLocator(document.body));
  });
});
