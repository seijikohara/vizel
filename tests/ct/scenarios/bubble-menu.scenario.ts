import { expect } from "vitest";

import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

const BUBBLE_MENU_SELECTOR = "[data-vizel-bubble-menu]";
const NODE_SELECTOR_SELECTOR = "[data-vizel-node-selector]";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve the bubble menu element. Tiptap shows the bubble menu only after a
// text selection is made, so poll until the element appears.
async function resolveBubbleMenu(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(BUBBLE_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(BUBBLE_MENU_SELECTOR);
  if (el === null) throw new Error("expected a [data-vizel-bubble-menu] element");
  return el;
}

// Type text into the editor and select all. This triggers the bubble menu,
// which appears only when the editor has a non-empty text selection.
async function selectTextInEditor(editorEl: HTMLElement): Promise<void> {
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Select this text");
  await pressKeyChord("Mod", "a");
  // Wait for the bubble menu to appear before returning, so callers do not race.
  await expect
    .poll(() => document.querySelector(BUBBLE_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
}

// Wait until the bubble menu is no longer visible in the DOM. The bubble menu
// element stays in the DOM but is hidden when the selection collapses, so poll
// visibility via `offsetParent` (null when `display:none` or `visibility:hidden`)
// or check computed style rather than relying on `toBeVisible`, which throws
// when the locator's underlying element is detached.
async function waitForBubbleMenuHidden(): Promise<void> {
  await expect
    .poll(
      () => {
        const el = document.querySelector<HTMLElement>(BUBBLE_MENU_SELECTOR);
        if (el === null) return true;
        // An element with `visibility:hidden` or `display:none` is not visible.
        const style = getComputedStyle(el);
        return (
          style.visibility === "hidden" || style.display === "none" || el.offsetParent === null
        );
      },
      { timeout: 5_000 }
    )
    .toBe(true);
}

// Wait until a selector produces no match in the document. Prefer this over
// `expect.element(locator).not.toBeVisible()` when the element may be removed
// from the DOM, because the locator throws when its backing element is detached.
async function waitForSelectorGone(selector: string): Promise<void> {
  await expect.poll(() => document.querySelector(selector), { timeout: 5_000 }).toBeNull();
}

/** Verify the bubble menu appears when text is selected. */
export const testBubbleMenuAppears: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();
};

/** Verify the bubble menu hides when Escape collapses the selection. */
export const testBubbleMenuHides: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();

  await userEvent.keyboard("{Escape}");
  await waitForBubbleMenuHidden();
};

/** Verify the bold button wraps the selection in `<strong>`. */
export const testBubbleMenuBoldToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const boldButton = bubbleMenu.querySelector<HTMLElement>('[data-action="bold"]');
  if (boldButton === null) throw new Error("expected a bold button in the bubble menu");
  await userEvent.click(page.elementLocator(boldButton));

  await expect
    .poll(() => editorEl.querySelector("strong")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify the italic button wraps the selection in `<em>`. */
export const testBubbleMenuItalicToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const italicButton = bubbleMenu.querySelector<HTMLElement>('[data-action="italic"]');
  if (italicButton === null) throw new Error("expected an italic button in the bubble menu");
  await userEvent.click(page.elementLocator(italicButton));

  await expect
    .poll(() => editorEl.querySelector("em")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify the strike button wraps the selection in `<s>`. */
export const testBubbleMenuStrikeToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const strikeButton = bubbleMenu.querySelector<HTMLElement>('[data-action="strike"]');
  if (strikeButton === null) throw new Error("expected a strike button in the bubble menu");
  await userEvent.click(page.elementLocator(strikeButton));

  await expect
    .poll(() => editorEl.querySelector("s")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify the underline button wraps the selection in `<u>`. */
export const testBubbleMenuUnderlineToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const underlineButton = bubbleMenu.querySelector<HTMLElement>('[data-action="underline"]');
  if (underlineButton === null) throw new Error("expected an underline button in the bubble menu");
  await userEvent.click(page.elementLocator(underlineButton));

  await expect
    .poll(() => editorEl.querySelector("u")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify Cmd+U applies underline formatting without using the bubble menu. */
export const testBubbleMenuUnderlineShortcut: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const editorLocator = page.elementLocator(editorEl);
  // Click to focus first; pressKeyChord does not focus the target.
  await userEvent.click(editorLocator);
  await pressKeyChord("Mod", "u");
  await userEvent.keyboard("Underlined");
  await pressKeyChord("Mod", "u");

  await expect
    .poll(() => editorEl.querySelector("u")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Underlined");
};

/** Verify the code button wraps the selection in `<code>`. */
export const testBubbleMenuCodeToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const codeButton = bubbleMenu.querySelector<HTMLElement>('[data-action="code"]');
  if (codeButton === null) throw new Error("expected a code button in the bubble menu");
  await userEvent.click(page.elementLocator(codeButton));

  await expect
    .poll(() => editorEl.querySelector("code")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify clicking the link button opens the link editor. */
export const testBubbleMenuLinkEditor: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const linkButton = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton === null) throw new Error("expected a link button in the bubble menu");
  await userEvent.click(page.elementLocator(linkButton));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected a .vizel-link-editor element");
  await expect.element(page.elementLocator(linkEditor)).toBeVisible();
};

/** Verify Escape closes the link editor and restores the bubble menu toolbar. */
export const testBubbleMenuLinkEditorEscapeCloses: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const linkButton = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton === null) throw new Error("expected a link button in the bubble menu");
  await userEvent.click(page.elementLocator(linkButton));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected a .vizel-link-editor element");
  await expect.element(page.elementLocator(linkEditor)).toBeVisible();

  await userEvent.keyboard("{Escape}");

  // The link editor closes on Escape; poll until it disappears from the DOM.
  await waitForSelectorGone(".vizel-link-editor");

  // The toolbar view restores after the link editor closes.
  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-bubble-menu-toolbar"), { timeout: 5_000 })
    .not.toBeNull();
  const toolbar = bubbleMenu.querySelector<HTMLElement>(".vizel-bubble-menu-toolbar");
  if (toolbar === null) throw new Error("expected a .vizel-bubble-menu-toolbar element");
  await expect.element(page.elementLocator(toolbar)).toBeVisible();
};

/** Verify clicking outside the link editor closes the link editor. */
export const testBubbleMenuLinkEditorClickOutsideCloses: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const linkButton = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton === null) throw new Error("expected a link button in the bubble menu");
  await userEvent.click(page.elementLocator(linkButton));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected a .vizel-link-editor element");
  await expect.element(page.elementLocator(linkEditor)).toBeVisible();

  // Dispatch a pointerdown event on the editor element outside the link editor.
  // The Playwright original clicked the editor body at a specific pixel offset.
  // In Vitest Browser Mode, `createVizelDismissable` listens for `pointerdown`
  // on the document, so dispatching a synthetic event on a sibling element
  // triggers the same outside-click dismissal path. `deferPointerHandler: true`
  // means the listener is not active on the first tick, but the link editor
  // mount happens synchronously before this line runs.
  editorEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));

  // The link editor closes when the outside-click handler fires.
  await waitForSelectorGone(".vizel-link-editor");
};

/** Verify the link editor submits a URL and creates an anchor element. */
export const testBubbleMenuLinkEditorSetLink: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const linkButton = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton === null) throw new Error("expected a link button in the bubble menu");
  await userEvent.click(page.elementLocator(linkButton));

  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected a .vizel-link-editor element");

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected a .vizel-link-input element");
  await userEvent.fill(page.elementLocator(urlInput), "https://example.com");

  const submitButton = linkEditor.querySelector<HTMLElement>('button[type="submit"]');
  if (submitButton === null) throw new Error("expected a submit button in the link editor");
  await userEvent.click(page.elementLocator(submitButton));

  // The link editor closes after submission.
  await waitForSelectorGone(".vizel-link-editor");

  await expect
    .poll(() => editorEl.querySelector("a")?.getAttribute("href"), { timeout: 5_000 })
    .toBe("https://example.com");
};

/** Verify the link editor removes an existing link via the remove button. */
export const testBubbleMenuLinkEditorRemoveLink: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const linkButton = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton === null) throw new Error("expected a link button in the bubble menu");

  // Set a link first.
  await userEvent.click(page.elementLocator(linkButton));
  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditor = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditor === null) throw new Error("expected a .vizel-link-editor element");

  const urlInput = linkEditor.querySelector<HTMLElement>(".vizel-link-input");
  if (urlInput === null) throw new Error("expected a .vizel-link-input element");
  await userEvent.fill(page.elementLocator(urlInput), "https://example.com");

  const submitButton = linkEditor.querySelector<HTMLElement>('button[type="submit"]');
  if (submitButton === null) throw new Error("expected a submit button in the link editor");
  await userEvent.click(page.elementLocator(submitButton));

  await waitForSelectorGone(".vizel-link-editor");
  await expect.poll(() => editorEl.querySelectorAll("a").length, { timeout: 5_000 }).toBe(1);

  // Re-select text and open the link editor to remove the link. Re-query the
  // bubble menu and link button after re-selection: the bubble menu re-renders
  // when the selection changes, so the original `linkButton` reference is stale.
  await pressKeyChord("Mod", "a");
  const bubbleMenu2 = await resolveBubbleMenu();
  const linkButton2 = bubbleMenu2.querySelector<HTMLElement>('[data-action="link"]');
  if (linkButton2 === null) throw new Error("expected a link button in the bubble menu");
  await userEvent.click(page.elementLocator(linkButton2));
  await expect
    .poll(() => document.querySelector(".vizel-link-editor"), { timeout: 5_000 })
    .not.toBeNull();
  const linkEditorAgain = document.querySelector<HTMLElement>(".vizel-link-editor");
  if (linkEditorAgain === null) throw new Error("expected a .vizel-link-editor element");
  await expect.element(page.elementLocator(linkEditorAgain)).toBeVisible();

  const removeButton = linkEditorAgain.querySelector<HTMLElement>(".vizel-link-remove");
  if (removeButton === null) throw new Error("expected a .vizel-link-remove button");
  await userEvent.click(page.elementLocator(removeButton));

  await waitForSelectorGone(".vizel-link-editor");
  await expect.poll(() => editorEl.querySelectorAll("a").length, { timeout: 5_000 }).toBe(0);
};

/** Verify bold button carries `is-active` class when the cursor is inside bold text. */
export const testBubbleMenuActiveState: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const editorLocator = page.elementLocator(editorEl);
  // Click to focus first; pressKeyChord does not focus the target.
  await userEvent.click(editorLocator);
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard("Bold");
  await pressKeyChord("Mod", "b");
  await pressKeyChord("Mod", "a");

  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();

  const boldButton = bubbleMenu.querySelector<HTMLElement>('[data-action="bold"]');
  if (boldButton === null) throw new Error("expected a bold button in the bubble menu");
  await expect.element(page.elementLocator(boldButton)).toHaveClass(/is-active/);
};

/** Verify the text color picker opens and applies a color span to the selection. */
export const testBubbleMenuTextColorToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const textColorButton = bubbleMenu.querySelector<HTMLElement>('[data-action="textColor"]');
  if (textColorButton === null) throw new Error("expected a textColor button in the bubble menu");
  await userEvent.click(page.elementLocator(textColorButton));

  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdown = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdown === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  await expect.element(page.elementLocator(dropdown)).toBeVisible();

  const redSwatch = dropdown.querySelector<HTMLElement>('[data-color="#ef4444"]');
  if (redSwatch === null) throw new Error("expected a red (#ef4444) color swatch");
  await userEvent.click(page.elementLocator(redSwatch));

  await expect
    .poll(() => editorEl.querySelector('span[style*="color"]')?.textContent ?? "", {
      timeout: 15_000,
    })
    .toContain("Select this text");
};

/** Verify the highlight color picker opens and applies a `<mark>` to the selection. */
export const testBubbleMenuHighlightToggle: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const highlightButton = bubbleMenu.querySelector<HTMLElement>('[data-action="highlight"]');
  if (highlightButton === null) throw new Error("expected a highlight button in the bubble menu");
  await userEvent.click(page.elementLocator(highlightButton));

  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdown = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdown === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  await expect.element(page.elementLocator(dropdown)).toBeVisible();

  const yellowSwatch = dropdown.querySelector<HTMLElement>('[data-color="#fef08a"]');
  if (yellowSwatch === null) throw new Error("expected a yellow (#fef08a) swatch");
  await userEvent.click(page.elementLocator(yellowSwatch));

  await expect
    .poll(() => editorEl.querySelector("mark")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify the text color resets to the default (no inline color span). */
export const testBubbleMenuTextColorReset: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const textColorButton = bubbleMenu.querySelector<HTMLElement>('[data-action="textColor"]');
  if (textColorButton === null) throw new Error("expected a textColor button in the bubble menu");

  // Apply a color first.
  await userEvent.click(page.elementLocator(textColorButton));
  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdown = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdown === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  const redSwatch = dropdown.querySelector<HTMLElement>('[data-color="#ef4444"]');
  if (redSwatch === null) throw new Error("expected a red (#ef4444) color swatch");
  await userEvent.click(page.elementLocator(redSwatch));

  await expect
    .poll(() => editorEl.querySelector('span[style*="color"]'), { timeout: 5_000 })
    .not.toBeNull();

  // Re-select and reset to default color.
  await pressKeyChord("Mod", "a");
  await expect
    .poll(() => document.querySelector(BUBBLE_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();

  // Re-query the dropdown after re-selection, since the bubble menu re-renders.
  await userEvent.click(page.elementLocator(textColorButton));
  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdownAgain = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdownAgain === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  const defaultSwatch = dropdownAgain.querySelector<HTMLElement>('[data-color="inherit"]');
  if (defaultSwatch === null) throw new Error("expected a default (inherit) color swatch");
  await userEvent.click(page.elementLocator(defaultSwatch));

  await expect
    .poll(() => editorEl.querySelectorAll('span[style*="color"]').length, { timeout: 5_000 })
    .toBe(0);
};

/** Verify the highlight resets to transparent (no `<mark>` element). */
export const testBubbleMenuHighlightReset: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const highlightButton = bubbleMenu.querySelector<HTMLElement>('[data-action="highlight"]');
  if (highlightButton === null) throw new Error("expected a highlight button in the bubble menu");

  // Apply a highlight first.
  await userEvent.click(page.elementLocator(highlightButton));
  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdown = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdown === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  const yellowSwatch = dropdown.querySelector<HTMLElement>('[data-color="#fef08a"]');
  if (yellowSwatch === null) throw new Error("expected a yellow (#fef08a) swatch");
  await userEvent.click(page.elementLocator(yellowSwatch));

  await expect.poll(() => editorEl.querySelector("mark"), { timeout: 5_000 }).not.toBeNull();

  // Re-select and remove the highlight.
  await pressKeyChord("Mod", "a");
  await expect
    .poll(() => document.querySelector(BUBBLE_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();

  // Re-query the dropdown after re-selection.
  await userEvent.click(page.elementLocator(highlightButton));
  await expect
    .poll(() => bubbleMenu.querySelector(".vizel-color-picker-dropdown"), { timeout: 5_000 })
    .not.toBeNull();
  const dropdownAgain = bubbleMenu.querySelector<HTMLElement>(".vizel-color-picker-dropdown");
  if (dropdownAgain === null) throw new Error("expected a .vizel-color-picker-dropdown element");
  const transparentSwatch = dropdownAgain.querySelector<HTMLElement>('[data-color="transparent"]');
  if (transparentSwatch === null) throw new Error("expected a transparent swatch");
  await userEvent.click(page.elementLocator(transparentSwatch));

  await expect.poll(() => editorEl.querySelectorAll("mark").length, { timeout: 5_000 }).toBe(0);
};

// Node Selector scenarios

/** Verify the node selector component appears in the bubble menu. */
export const testNodeSelectorAppears: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  await expect.element(page.elementLocator(nodeSelector)).toBeVisible();
};

/** Verify clicking the node selector trigger opens the dropdown. */
export const testNodeSelectorDropdownOpens: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");
  await userEvent.click(page.elementLocator(trigger));

  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");
  await expect.element(page.elementLocator(dropdown)).toBeVisible();
};

/** Verify selecting "Heading 1" converts the current paragraph to an H1. */
export const testNodeSelectorHeading1: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");
  await userEvent.click(page.elementLocator(trigger));

  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");

  const options = Array.from(dropdown.querySelectorAll<HTMLElement>(".vizel-node-selector-option"));
  const heading1Option = options.find((el) => el.textContent?.includes("Heading 1"));
  if (heading1Option === undefined) throw new Error("expected a Heading 1 option");
  await userEvent.click(page.elementLocator(heading1Option));

  await expect
    .poll(() => editorEl.querySelector("h1")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify selecting "Bullet List" converts the current paragraph to a list item. */
export const testNodeSelectorBulletList: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");
  await userEvent.click(page.elementLocator(trigger));

  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");

  const options = Array.from(dropdown.querySelectorAll<HTMLElement>(".vizel-node-selector-option"));
  const bulletListOption = options.find((el) => el.textContent?.includes("Bullet List"));
  if (bulletListOption === undefined) throw new Error("expected a Bullet List option");
  await userEvent.click(page.elementLocator(bulletListOption));

  await expect
    .poll(() => editorEl.querySelector("ul li")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/**
 * Verify the active node type is reflected in the trigger label and option class.
 *
 * After converting to Heading 1, re-selecting the heading should show "Heading 1"
 * in the trigger and mark the matching option as `is-active` in the dropdown.
 */
export const testNodeSelectorActiveState: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Heading Text");
  await pressKeyChord("Mod", "a");

  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");

  // Convert to Heading 1.
  await userEvent.click(page.elementLocator(trigger));
  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");

  const options = Array.from(dropdown.querySelectorAll<HTMLElement>(".vizel-node-selector-option"));
  const heading1Option = options.find((el) => el.textContent?.includes("Heading 1"));
  if (heading1Option === undefined) throw new Error("expected a Heading 1 option");
  await userEvent.click(page.elementLocator(heading1Option));

  await expect
    .poll(() => editorEl.querySelector("h1")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Heading Text");

  // Re-select and verify trigger label.
  await pressKeyChord("Mod", "a");
  await expect
    .poll(() => document.querySelector(BUBBLE_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();

  await expect.poll(() => trigger.textContent, { timeout: 5_000 }).toContain("Heading 1");

  // Verify active class on the option after opening the dropdown again. Re-query
  // the dropdown after clicking the trigger: the dropdown re-renders on each
  // open, so option elements from the first open are detached and stale.
  await userEvent.click(page.elementLocator(trigger));
  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown2 = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown2 === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");
  const updatedOptions = Array.from(
    dropdown2.querySelectorAll<HTMLElement>(".vizel-node-selector-option")
  );
  const activeOption = updatedOptions.find((el) => el.textContent?.includes("Heading 1"));
  if (activeOption === undefined) throw new Error("expected a Heading 1 option");
  await expect.element(page.elementLocator(activeOption)).toHaveClass(/is-active/);
};

/** Verify ArrowDown focuses the next option and Enter selects it. */
export const testNodeSelectorKeyboardNavigation: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");

  await userEvent.click(page.elementLocator(trigger));
  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");
  await expect.element(page.elementLocator(dropdown)).toBeVisible();

  // Navigate to the first non-Text option (Heading 1).
  await userEvent.keyboard("{ArrowDown}");

  const heading1Option = Array.from(
    dropdown.querySelectorAll<HTMLElement>(".vizel-node-selector-option")
  ).find((el) => el.textContent?.includes("Heading 1"));
  if (heading1Option === undefined) throw new Error("expected a Heading 1 option");
  await expect.element(page.elementLocator(heading1Option)).toHaveClass(/is-focused/);

  // Select with Enter.
  await userEvent.keyboard("{Enter}");

  await expect
    .poll(() => editorEl.querySelector("h1")?.textContent ?? "", { timeout: 15_000 })
    .toContain("Select this text");
};

/** Verify Escape closes the node selector dropdown without changing the node type. */
export const testNodeSelectorEscapeCloses: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();

  const nodeSelector = bubbleMenu.querySelector<HTMLElement>(NODE_SELECTOR_SELECTOR);
  if (nodeSelector === null) throw new Error("expected a [data-vizel-node-selector] element");
  const trigger = nodeSelector.querySelector<HTMLElement>(".vizel-node-selector-trigger");
  if (trigger === null) throw new Error("expected a .vizel-node-selector-trigger element");

  await userEvent.click(page.elementLocator(trigger));
  await expect
    .poll(() => nodeSelector.querySelector("[data-vizel-node-selector-dropdown]"), {
      timeout: 5_000,
    })
    .not.toBeNull();
  const dropdown = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
  if (dropdown === null) throw new Error("expected a [data-vizel-node-selector-dropdown] element");
  await expect.element(page.elementLocator(dropdown)).toBeVisible();

  await userEvent.keyboard("{Escape}");
  // Poll until the dropdown disappears or is no longer visible.
  await expect
    .poll(
      () => {
        const el = nodeSelector.querySelector<HTMLElement>("[data-vizel-node-selector-dropdown]");
        if (el === null) return true;
        const style = getComputedStyle(el);
        return (
          style.visibility === "hidden" || style.display === "none" || el.offsetParent === null
        );
      },
      { timeout: 5_000 }
    )
    .toBe(true);
};
