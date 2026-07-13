import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";

import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import OutlineFixture from "./OutlineFixture.vue";

describe("Outline a11y (Vitest Browser) - Vue", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    render(OutlineFixture);
    await expectNoVizelA11yViolations();
  });
});
