import { describe, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
} from "../../scenarios/bubble-menu-bc.scenario";
import { EditorFixture } from "./EditorFixture";

describe("BubbleMenu (Vitest Browser) - React", () => {
  test("appears when text is selected", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuAppears(page.elementLocator(document.body));
  });

  test("hides when selection is cleared", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuHides(page.elementLocator(document.body));
  });

  test("toggles bold formatting", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuBoldToggle(page.elementLocator(document.body));
  });

  test("toggles italic formatting", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuItalicToggle(page.elementLocator(document.body));
  });

  test("toggles strikethrough formatting", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuStrikeToggle(page.elementLocator(document.body));
  });

  test("toggles underline formatting", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuUnderlineToggle(page.elementLocator(document.body));
  });

  test("toggles underline with keyboard shortcut", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuUnderlineShortcut(page.elementLocator(document.body));
  });

  test("toggles inline code formatting", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuCodeToggle(page.elementLocator(document.body));
  });

  test("opens link editor", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuLinkEditor(page.elementLocator(document.body));
  });

  test("link editor closes with Escape", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuLinkEditorEscapeCloses(page.elementLocator(document.body));
  });

  test("link editor closes on click outside", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuLinkEditorClickOutsideCloses(page.elementLocator(document.body));
  });

  test("link editor sets link", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuLinkEditorSetLink(page.elementLocator(document.body));
  });

  test("link editor removes link", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuLinkEditorRemoveLink(page.elementLocator(document.body));
  });

  test("shows active state for formatted text", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuActiveState(page.elementLocator(document.body));
  });

  test("applies text color", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuTextColorToggle(page.elementLocator(document.body));
  });

  test("applies highlight color", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuHighlightToggle(page.elementLocator(document.body));
  });

  test("resets text color to default", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuTextColorReset(page.elementLocator(document.body));
  });

  test("removes highlight", async () => {
    await render(<EditorFixture />);
    await testBubbleMenuHighlightReset(page.elementLocator(document.body));
  });

  test("node selector appears in bubble menu", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorAppears(page.elementLocator(document.body));
  });

  test("node selector dropdown opens on click", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorDropdownOpens(page.elementLocator(document.body));
  });

  test("node selector converts to heading 1", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorHeading1(page.elementLocator(document.body));
  });

  test("node selector converts to bullet list", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorBulletList(page.elementLocator(document.body));
  });

  test("node selector shows active state", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorActiveState(page.elementLocator(document.body));
  });

  test("node selector keyboard navigation works", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorKeyboardNavigation(page.elementLocator(document.body));
  });

  test("node selector closes with Escape", async () => {
    await render(<EditorFixture />);
    await testNodeSelectorEscapeCloses(page.elementLocator(document.body));
  });
});
