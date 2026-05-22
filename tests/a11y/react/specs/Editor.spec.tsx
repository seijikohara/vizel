import { test } from "@playwright/experimental-ct-react";
import { expectNoVizelA11yViolations } from "../../scenarios/axe.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("Editor a11y - React", () => {
  test("emits no WCAG 2.1 AA violations", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await expectNoVizelA11yViolations(component, page);
  });
});
