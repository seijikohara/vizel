import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import ToolbarFixture from "./ToolbarFixture.svelte";

describe("Toolbar a11y (Vitest Browser) - Svelte", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    await render(ToolbarFixture);
    await expectNoVizelA11yViolations();
  });
});
