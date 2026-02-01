import { test } from "@playwright/experimental-ct-vue";
import {
  testVizelBubbleMenuFormatting,
  testVizelBubbleMenuOnSelection,
  testVizelPlaceholder,
  testVizelRenders,
  testVizelSlashMenu,
  testVizelTyping,
  testVizelWithoutBubbleMenu,
} from "../../scenarios/vizel.scenario";
import VizelFixture from "./VizelFixture.vue";

test.describe("Vizel - Vue", () => {
  test("renders with editor and bubble menu", async ({ mount, page }) => {
    const component = await mount(VizelFixture);
    await testVizelRenders(component, page);
  });

  test("shows placeholder when empty", async ({ mount, page }) => {
    const component = await mount(VizelFixture, {
      props: { placeholder: "Start writing..." },
    });
    await testVizelPlaceholder(component, page, "Start writing...");
  });

  test("accepts text input", async ({ mount, page }) => {
    const component = await mount(VizelFixture);
    await testVizelTyping(component, page);
  });

  test("shows bubble menu on text selection", async ({ mount, page }) => {
    const component = await mount(VizelFixture);
    await testVizelBubbleMenuOnSelection(component, page);
  });

  test("hides bubble menu when showBubbleMenu is false", async ({ mount, page }) => {
    const component = await mount(VizelFixture, {
      props: { showBubbleMenu: false },
    });
    await testVizelWithoutBubbleMenu(component, page);
  });

  test("opens slash menu on / key", async ({ mount, page }) => {
    const component = await mount(VizelFixture);
    await testVizelSlashMenu(component, page);
  });

  test("applies formatting via bubble menu", async ({ mount, page }) => {
    const component = await mount(VizelFixture);
    await testVizelBubbleMenuFormatting(component, page);
  });
});
