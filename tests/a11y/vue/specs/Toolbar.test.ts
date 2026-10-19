import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";

import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import ToolbarFixture from "./ToolbarFixture.vue";

describe("Toolbar a11y (Vitest Browser) - Vue", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    await render(ToolbarFixture);
    await expectNoVizelA11yViolations();
  });
});
