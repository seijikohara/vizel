import { test } from "@playwright/experimental-ct-vue";
import {
  testBubbleMenuActiveState,
  testBubbleMenuAppears,
  testBubbleMenuBoldToggle,
  testBubbleMenuCodeToggle,
  testBubbleMenuHides,
  testBubbleMenuHighlightReset,
  testBubbleMenuHighlightToggle,
  testBubbleMenuItalicToggle,
  testBubbleMenuLinkEditor,
  testBubbleMenuStrikeToggle,
  testBubbleMenuTextColorReset,
  testBubbleMenuTextColorToggle,
  testBubbleMenuUnderlineShortcut,
  testBubbleMenuUnderlineToggle,
} from "../../scenarios/bubble-menu.scenario";
import EditorFixture from "./EditorFixture.vue";

test.describe("BubbleMenu - Vue", () => {
  test("appears when text is selected", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuAppears(component, page);
  });

  test("hides when selection is cleared", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuHides(component, page);
  });

  test("toggles bold formatting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuBoldToggle(component, page);
  });

  test("toggles italic formatting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuItalicToggle(component, page);
  });

  test("toggles strikethrough formatting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuStrikeToggle(component, page);
  });

  test("toggles underline formatting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuUnderlineToggle(component, page);
  });

  test("toggles underline with keyboard shortcut", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuUnderlineShortcut(component, page);
  });

  test("toggles inline code formatting", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuCodeToggle(component, page);
  });

  test("opens link editor", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuLinkEditor(component, page);
  });

  test("shows active state for formatted text", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuActiveState(component, page);
  });

  test("applies text color", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuTextColorToggle(component, page);
  });

  test("applies highlight color", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuHighlightToggle(component, page);
  });

  test("resets text color to default", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuTextColorReset(component, page);
  });

  test("removes highlight", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuHighlightReset(component, page);
  });
});
