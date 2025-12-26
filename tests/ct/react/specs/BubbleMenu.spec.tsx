import { test } from "@playwright/experimental-ct-react";
import {
  testBubbleMenuActiveState,
  testBubbleMenuAppears,
  testBubbleMenuBoldToggle,
  testBubbleMenuCodeToggle,
  testBubbleMenuHides,
  testBubbleMenuItalicToggle,
  testBubbleMenuLinkEditor,
  testBubbleMenuStrikeToggle,
} from "../../scenarios/bubble-menu.scenario";
import { EditorFixture } from "./EditorFixture";

test.describe("BubbleMenu - React", () => {
  test("appears when text is selected", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuAppears(component, page);
  });

  test("hides when selection is cleared", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuHides(component, page);
  });

  test("toggles bold formatting", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuBoldToggle(component, page);
  });

  test("toggles italic formatting", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuItalicToggle(component, page);
  });

  test("toggles strikethrough formatting", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuStrikeToggle(component, page);
  });

  test("toggles inline code formatting", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuCodeToggle(component, page);
  });

  test("opens link editor", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuLinkEditor(component, page);
  });

  test("shows active state for formatted text", async ({ mount, page }) => {
    const component = await mount(<EditorFixture />);
    await testBubbleMenuActiveState(component, page);
  });
});
