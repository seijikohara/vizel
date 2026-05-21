import { test } from "@playwright/experimental-ct-vue";
import {
  testOutlineClickMovesSelection,
  testOutlineRendersHeadings,
} from "../../scenarios/outline.scenario";
import OutlineFixture from "./OutlineFixture.vue";

test.describe("VizelOutline - Vue", () => {
  test("renders one entry per heading", async ({ mount, page }) => {
    const component = await mount(OutlineFixture);
    await testOutlineRendersHeadings(component, page);
  });

  test("clicking an entry moves the selection", async ({ mount, page }) => {
    const component = await mount(OutlineFixture);
    await testOutlineClickMovesSelection(component, page);
  });
});
