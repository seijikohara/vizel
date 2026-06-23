import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  testDividerAcceptsCustomClass,
  testDividerIsSpanElement,
  testDividerRendersWithBaseClass,
} from "../../scenarios/bubble-menu-divider-bc.scenario";
import { BubbleMenuDividerFixture } from "./BubbleMenuDividerFixture";

describe("BubbleMenuDivider (Vitest Browser) - React", () => {
  test("renders with base class", async () => {
    await render(<BubbleMenuDividerFixture />);
    await testDividerRendersWithBaseClass(page.elementLocator(document.body));
  });

  test("accepts custom className", async () => {
    await render(<BubbleMenuDividerFixture className="custom-divider" />);
    await testDividerAcceptsCustomClass(page.elementLocator(document.body));
  });

  test("renders as span element", async () => {
    await render(<BubbleMenuDividerFixture />);
    await testDividerIsSpanElement(page.elementLocator(document.body));
  });
});
