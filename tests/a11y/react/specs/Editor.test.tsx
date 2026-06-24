import { describe, test } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import { EditorFixture } from "./EditorFixture";

describe("Editor a11y (Vitest Browser) - React", () => {
  test("emits no WCAG 2.1 AA violations", async () => {
    await render(<EditorFixture />);
    await expectNoVizelA11yViolations();
  });
});
