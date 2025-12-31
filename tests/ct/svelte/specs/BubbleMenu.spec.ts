import { test } from "@playwright/experimental-ct-svelte";
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
  testBubbleMenuLinkEditorClickOutsideCloses,
  testBubbleMenuLinkEditorEscapeCloses,
  testBubbleMenuLinkEditorRemoveLink,
  testBubbleMenuLinkEditorSetLink,
  testBubbleMenuStrikeToggle,
  testBubbleMenuTextColorReset,
  testBubbleMenuTextColorToggle,
  testBubbleMenuUnderlineShortcut,
  testBubbleMenuUnderlineToggle,
  testNodeSelectorActiveState,
  testNodeSelectorAppears,
  testNodeSelectorBulletList,
  testNodeSelectorDropdownOpens,
  testNodeSelectorEscapeCloses,
  testNodeSelectorHeading1,
  testNodeSelectorKeyboardNavigation,
} from "../../scenarios/bubble-menu.scenario";
import EditorFixture from "./EditorFixture.svelte";

test.describe("BubbleMenu - Svelte", () => {
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

  test("link editor closes with Escape", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuLinkEditorEscapeCloses(component, page);
  });

  test("link editor closes on click outside", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuLinkEditorClickOutsideCloses(component, page);
  });

  test("link editor sets link", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuLinkEditorSetLink(component, page);
  });

  test("link editor removes link", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testBubbleMenuLinkEditorRemoveLink(component, page);
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

  // Node Selector tests
  test("node selector appears in bubble menu", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorAppears(component, page);
  });

  test("node selector dropdown opens on click", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorDropdownOpens(component, page);
  });

  test("node selector converts to heading 1", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorHeading1(component, page);
  });

  test("node selector converts to bullet list", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorBulletList(component, page);
  });

  test("node selector shows active state", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorActiveState(component, page);
  });

  test("node selector keyboard navigation works", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorKeyboardNavigation(component, page);
  });

  test("node selector closes with Escape", async ({ mount, page }) => {
    const component = await mount(EditorFixture);
    await testNodeSelectorEscapeCloses(component, page);
  });
});
