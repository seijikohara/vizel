import { test } from "@playwright/experimental-ct-react";
import {
  testDividerAcceptsCustomClass,
  testDividerIsSpanElement,
  testDividerRendersWithBaseClass,
} from "../../scenarios/bubble-menu-divider.scenario";
import { BubbleMenuDividerFixture } from "./BubbleMenuDividerFixture";

test.describe("BubbleMenuDivider - React", () => {
  test("renders with base class", async ({ mount, page }) => {
    const component = await mount(<BubbleMenuDividerFixture />);
    await testDividerRendersWithBaseClass(component, page);
  });

  test("accepts custom className", async ({ mount, page }) => {
    const component = await mount(<BubbleMenuDividerFixture className="custom-divider" />);
    await testDividerAcceptsCustomClass(component, page);
  });

  test("renders as span element", async ({ mount, page }) => {
    const component = await mount(<BubbleMenuDividerFixture />);
    await testDividerIsSpanElement(component, page);
  });
});
