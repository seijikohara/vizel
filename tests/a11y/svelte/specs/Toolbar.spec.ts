import { test } from "@playwright/experimental-ct-svelte";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import ToolbarFixture from "./ToolbarFixture.svelte";

test.describe("Toolbar a11y - Svelte", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(ToolbarFixture);
    await expectNoVizelA11yViolations(component, page);
  });
});
