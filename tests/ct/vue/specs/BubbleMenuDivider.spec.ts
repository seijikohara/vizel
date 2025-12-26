import { test } from "@playwright/experimental-ct-vue";
import {
  testDividerAcceptsCustomClass,
  testDividerIsSpanElement,
  testDividerRendersWithBaseClass,
} from "../../scenarios/bubble-menu-divider.scenario";
import BubbleMenuDividerFixture from "./BubbleMenuDividerFixture.vue";

test.describe("BubbleMenuDivider - Vue", () => {
  test("renders with base class", async ({ mount, page }) => {
    const component = await mount(BubbleMenuDividerFixture);
    await testDividerRendersWithBaseClass(component, page);
  });

  test("accepts custom class", async ({ mount, page }) => {
    const component = await mount(BubbleMenuDividerFixture, {
      props: { class: "custom-divider" },
    });
    await testDividerAcceptsCustomClass(component, page);
  });

  test("renders as span element", async ({ mount, page }) => {
    const component = await mount(BubbleMenuDividerFixture);
    await testDividerIsSpanElement(component, page);
  });
});
