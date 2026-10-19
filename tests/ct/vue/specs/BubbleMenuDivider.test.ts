import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
import { page } from "vitest/browser";

import {
  testDividerAcceptsCustomClass,
  testDividerIsSpanElement,
  testDividerRendersWithBaseClass,
} from "../../scenarios/bubble-menu-divider.scenario";
import BubbleMenuDividerFixture from "./BubbleMenuDividerFixture.vue";

describe("BubbleMenuDivider (Vitest Browser) - Vue", () => {
  test("renders with base class", async () => {
    await render(BubbleMenuDividerFixture);
    await testDividerRendersWithBaseClass(page.elementLocator(document.body));
  });

  test("accepts custom class", async () => {
    await render(BubbleMenuDividerFixture, { props: { class: "custom-divider" } });
    await testDividerAcceptsCustomClass(page.elementLocator(document.body));
  });

  test("renders as span element", async () => {
    await render(BubbleMenuDividerFixture);
    await testDividerIsSpanElement(page.elementLocator(document.body));
  });
});
