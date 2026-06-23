import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoVizelA11yViolations } from "../../scenarios/axe-bc.scenario";
import { OutlineFixture } from "./OutlineFixture";

describe("Outline a11y (Vitest Browser) - React", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    await render(<OutlineFixture />);
    await expectNoVizelA11yViolations();
  });
});
