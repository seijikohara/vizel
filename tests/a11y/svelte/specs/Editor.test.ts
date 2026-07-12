import { describe, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import EditorFixture from "./EditorFixture.svelte";

describe("Editor a11y (Vitest Browser) - Svelte", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    render(EditorFixture);
    await expectNoVizelA11yViolations();
  });
});
