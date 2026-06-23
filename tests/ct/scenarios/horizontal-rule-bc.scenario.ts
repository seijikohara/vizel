import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears rather than
// querying once. `.vizel-editor` is a div, not an ARIA textbox, so the
// scenario queries by class.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and under that contention the asynchronous Tiptap
  // mount can exceed the default 1s poll budget before the editor view appears.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

/**
 * Verify a horizontal rule inserts via the slash command "/divider".
 *
 * The slash menu closes after the user presses Enter to confirm the selection,
 * so the scenario asserts the menu is no longer visible and the `<hr>` appears.
 */
export const testHorizontalRuleViaSlashCommand: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/divider");
  await userEvent.keyboard("{Enter}");

  // The slash menu closes when the command executes.
  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .toBeNull();

  // The horizontal rule must appear in the editor.
  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify a horizontal rule inserts via the "---" input rule.
 *
 * Tiptap's HorizontalRule extension fires the input rule on any of the three
 * patterns the Markdown spec defines. "---" is the most natural form.
 */
export const testHorizontalRuleViaHyphens: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("---");

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify a horizontal rule inserts via the "*** " input rule.
 *
 * Tiptap requires a trailing space to distinguish "*** " from the start of
 * bold-italic markup, so the scenario types the four-character sequence.
 */
export const testHorizontalRuleViaAsterisks: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("*** ");

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify a horizontal rule inserts via the "___ " input rule.
 *
 * A trailing space is required for the same disambiguation reason as "*** ".
 */
export const testHorizontalRuleViaUnderscores: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("___ ");

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
};

/**
 * Verify clicking a horizontal rule applies the ProseMirror node-selection class.
 *
 * ProseMirror adds `ProseMirror-selectednode` to a node when the editor holds a
 * node selection on that node. Clicking the `<hr>` directly establishes that
 * selection.
 */
export const testHorizontalRuleSelection: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("---");

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
  const hr = el.querySelector<HTMLElement>("hr");
  if (hr === null) throw new Error("expected an <hr> element");

  await userEvent.click(page.elementLocator(hr));

  await expect
    .poll(() => hr.classList.contains("ProseMirror-selectednode"), { timeout: 5_000 })
    .toBe(true);
};

/**
 * Verify pressing Backspace on a selected horizontal rule deletes the element.
 *
 * The node must first be selected (ProseMirror node selection) before Backspace
 * removes it; a cursor position that merely follows the `<hr>` does not suffice.
 */
export const testHorizontalRuleDelete: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("---");

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
  const hr = el.querySelector<HTMLElement>("hr");
  if (hr === null) throw new Error("expected an <hr> element");

  // Click to select the node, then delete it.
  await userEvent.click(page.elementLocator(hr));
  await expect
    .poll(() => hr.classList.contains("ProseMirror-selectednode"), { timeout: 5_000 })
    .toBe(true);

  await userEvent.keyboard("{Backspace}");

  // The element is removed from the document after deletion.
  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).toBeNull();
};

/**
 * Verify the "Divider" item appears in the slash menu after typing "/divider".
 *
 * The scenario checks both the menu container and the specific menu item so a
 * filtering regression surfaces as a missing item rather than a missing menu.
 */
export const testDividerInSlashMenu: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/divider");

  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();

  // The menu must contain a "Divider" item.
  await expect
    .poll(
      () => {
        const menu = document.querySelector(SLASH_MENU_SELECTOR);
        if (menu === null) return null;
        const items = menu.querySelectorAll(".vizel-slash-menu-item");
        for (const item of items) {
          if (item.textContent?.includes("Divider")) return item;
        }
        return null;
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
};
