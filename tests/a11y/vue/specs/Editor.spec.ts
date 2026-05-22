import { test } from "@playwright/experimental-ct-vue";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import EditorFixture from "./EditorFixture.vue";

test.describe("Editor a11y - Vue", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await expectNoVizelA11yViolations(component, page);
  });
});
