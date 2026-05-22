import { test } from "@playwright/experimental-ct-svelte";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("Editor a11y - Svelte", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await expectNoVizelA11yViolations(component, page);
  });
});
