import { test } from "@playwright/experimental-ct-vue";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import ToolbarFixture from "./ToolbarFixture.vue";

test.describe("Toolbar a11y - Vue", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(ToolbarFixture);
    await expectNoVizelA11yViolations(component, page);
  });
});
