import { test } from "@playwright/experimental-ct-vue";
import {
  testMinimapPointerFocusesEditor,
  testMinimapRendersBlocks,
} from "../../scenarios/minimap.scenario";
import MinimapFixture from "./MinimapFixture.vue";

test.describe("VizelMinimap - Vue", () => {
  test("renders block rectangles after typing", async ({ mount, page }) => {
    const component = await mount(MinimapFixture);
    await testMinimapRendersBlocks(component, page);
  });

  test("pointer-down focuses the editor", async ({ mount, page }) => {
    const component = await mount(MinimapFixture);
    await testMinimapPointerFocusesEditor(component, page);
  });
});
