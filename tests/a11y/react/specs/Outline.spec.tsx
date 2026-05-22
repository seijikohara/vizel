import { test } from "@playwright/experimental-ct-react";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import { OutlineFixture } from "./OutlineFixture";

test.describe("Outline a11y - React", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(<OutlineFixture />);
    await expectNoVizelA11yViolations(component, page);
  });
});
