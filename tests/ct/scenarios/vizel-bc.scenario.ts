import { expect } from "vitest";
import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears. Allow 15 s:
// the full nine-instance matrix saturates the machine and the async mount can
// exceed the default 1 s budget.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve the bubble menu element. The bubble menu is attached to the DOM on
// mount but becomes visible only after a text selection is made.
async function resolveBubbleMenu(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("[data-vizel-bubble-menu]");
  if (el === null) throw new Error("expected a [data-vizel-bubble-menu] element");
  return el;
}

// Type text into the editor and select all so the bubble menu becomes visible.
async function selectTextInEditor(editorEl: HTMLElement): Promise<void> {
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Select this text");
  await pressKeyChord("Mod", "a");
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 5_000 })
    .not.toBeNull();
}

/**
 * Verify the Vizel all-in-one component renders with an editor and a bubble menu.
 *
 * The bubble menu element is attached to the DOM on mount (not detached) even
 * when no selection is active; the editor must be visible and editable.
 */
export const testVizelRenders: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();
  expect(el.getAttribute("contenteditable")).toBe("true");

  // The bubble menu renders into a portal on document.body. The Playwright
  // original asserts `toBeAttached`, which maps to `not.toBeNull()` here.
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 5_000 })
    .not.toBeNull();
};

/**
 * Verify the placeholder attribute is propagated to the editor node.
 *
 * The placeholder renders as a CSS `::before` pseudo-element driven by the
 * `data-placeholder` attribute on the paragraph node, so the scenario asserts
 * the attribute value rather than visible text content.
 */
export const testVizelPlaceholder = async (expectedPlaceholder: string): Promise<void> => {
  const el = await resolveEditor();
  await expect
    .poll(() => el.querySelector("[data-placeholder]")?.getAttribute("data-placeholder"), {
      timeout: 5_000,
    })
    .toBe(expectedPlaceholder);
};

/**
 * Verify the Vizel component accepts typed text.
 *
 * The scenario clicks the editor to place focus, types a sentence, and then
 * asserts the sentence is present in the editor's text content.
 */
export const testVizelTyping: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editorLocator = page.elementLocator(el);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Hello from Vizel!");
  await expect.element(editorLocator).toHaveTextContent("Hello from Vizel!");
};

/**
 * Verify the bubble menu becomes visible after a text selection is made.
 *
 * The bubble menu renders into a portal on `document.body`, so the scenario
 * queries the document directly rather than the fixture root.
 */
export const testVizelBubbleMenuOnSelection: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  await selectTextInEditor(editorEl);
  const bubbleMenu = await resolveBubbleMenu();
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();
};

/**
 * Verify the Vizel component renders without a bubble menu when `showBubbleMenu`
 * is `false`.
 *
 * The Playwright original asserts `not.toBeAttached`, meaning the element is
 * absent from the DOM. Here the scenario confirms the selector returns null.
 */
export const testVizelWithoutBubbleMenu: VizelBcScenario = async () => {
  await resolveEditor();
  // When showBubbleMenu is false the portal element is never mounted. Poll
  // briefly to confirm absence rather than checking once (the fixture mounts
  // asynchronously and the element could still be arriving).
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 3_000 })
    .toBeNull();
};

/**
 * Verify the slash command menu appears when the user types `/` in the editor.
 *
 * The slash menu renders into a portal on `document.body`; the scenario polls
 * the document for the selector that Vizel mounts on slash-menu open.
 */
export const testVizelSlashMenu: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editorLocator = page.elementLocator(el);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "/");
  await expect
    .poll(() => document.querySelector("[data-vizel-slash-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  const slashMenu = document.querySelector<HTMLElement>("[data-vizel-slash-menu]");
  if (slashMenu === null) throw new Error("expected a [data-vizel-slash-menu] element");
  await expect.element(page.elementLocator(slashMenu)).toBeVisible();
};

/**
 * Verify the bubble menu bold button wraps the selected text in `<strong>`.
 *
 * The scenario types text, selects all, waits for the bubble menu, clicks the
 * bold action, and then checks for a `<strong>` element in the editor.
 */
export const testVizelBubbleMenuFormatting: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Format this");

  await pressKeyChord("Mod", "a");

  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  const bubbleMenu = document.querySelector<HTMLElement>("[data-vizel-bubble-menu]");
  if (bubbleMenu === null) throw new Error("expected a [data-vizel-bubble-menu] element");
  await expect.element(page.elementLocator(bubbleMenu)).toBeVisible();

  const boldButton = bubbleMenu.querySelector<HTMLElement>('[data-action="bold"]');
  if (boldButton === null) throw new Error("expected a bold button in the bubble menu");
  await userEvent.click(page.elementLocator(boldButton));

  await expect
    .poll(() => editorEl.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Format this");
};
