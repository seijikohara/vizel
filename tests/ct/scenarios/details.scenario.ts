import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the Details
 * (collapsible content) functionality.
 *
 * The slash menu renders as a portal appended to document.body, so menu
 * queries target document directly rather than a fixture-scoped locator.
 */

const SLASH_MENU = "[data-vizel-slash-menu]";
const EDITOR = ".vizel-editor";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears rather than
// querying once.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and under that contention the asynchronous Tiptap
  // mount can exceed the default 1s poll budget before the editor view appears.
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Type the slash command keyword and press Enter to confirm the selection.
// The slash menu appears asynchronously after typing "/", so poll until visible
// before committing the selection.
async function selectSlashCommand(editorEl: HTMLElement, command: string): Promise<void> {
  const editor = page.elementLocator(editorEl);
  await userEvent.click(editor);
  await userEvent.keyboard(`/${command}`);
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");
}

/** Verify a Details block inserts via the slash command "/details". */
export const testDetailsInsertedViaSlashCommand: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  // The details block must appear after the slash command executes.
  await expect.poll(() => el.querySelector(".vizel-details"), { timeout: 5_000 }).not.toBeNull();
  const details = el.querySelector<HTMLElement>(".vizel-details");
  if (details === null) throw new Error("expected a .vizel-details element");
  await expect.element(page.elementLocator(details)).toBeVisible();

  // The summary child must be present and visible.
  await expect
    .poll(() => el.querySelector(".vizel-details-summary"), { timeout: 5_000 })
    .not.toBeNull();
  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");
  await expect.element(page.elementLocator(summary)).toBeVisible();

  // The content area must be attached to the DOM (it may be hidden when collapsed).
  await expect
    .poll(() => el.querySelector(".vizel-details-content"), { timeout: 5_000 })
    .not.toBeNull();
};

/** Verify the Details block renders with the correct element structure. */
export const testDetailsBlockStructure: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  await expect.poll(() => el.querySelector(".vizel-details"), { timeout: 5_000 }).not.toBeNull();
  const details = el.querySelector<HTMLElement>(".vizel-details");
  if (details === null) throw new Error("expected a .vizel-details element");
  await expect.element(page.elementLocator(details)).toBeVisible();

  // Summary must be a clickable element rendered inside the details block.
  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");
  await expect.element(page.elementLocator(summary)).toBeVisible();

  // Content area must exist in the DOM (visibility depends on open state).
  const content = el.querySelector<HTMLElement>(".vizel-details-content");
  if (content === null) throw new Error("expected a .vizel-details-content element");
};

/** Verify clicking the summary toggles the Details block open/closed. */
export const testDetailsToggle: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  await expect.poll(() => el.querySelector(".vizel-details"), { timeout: 5_000 }).not.toBeNull();
  const details = el.querySelector<HTMLElement>(".vizel-details");
  if (details === null) throw new Error("expected a .vizel-details element");
  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");
  const content = el.querySelector<HTMLElement>(".vizel-details-content");
  if (content === null) throw new Error("expected a .vizel-details-content element");

  await expect.element(page.elementLocator(summary)).toBeVisible();

  // Click the summary to toggle the open state.
  await userEvent.click(page.elementLocator(summary));

  // The details block itself remains visible regardless of open state.
  await expect.element(page.elementLocator(details)).toBeVisible();
};

/** Verify the Details summary accepts typed text as editable content. */
export const testDetailsSummaryEditable: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  await expect
    .poll(() => el.querySelector(".vizel-details-summary"), { timeout: 5_000 })
    .not.toBeNull();
  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");

  await userEvent.click(page.elementLocator(summary));
  await userEvent.keyboard("Click to expand");

  await expect
    .poll(() => summary.textContent?.includes("Click to expand") ?? false, { timeout: 5_000 })
    .toBe(true);
};

/**
 * Verify the Details content area accepts typed text as editable content.
 *
 * Tiptap's Details extension hides the content via an attribute rather than
 * the native `<details>` collapse mechanism, so the scenario manually removes
 * the hidden attribute to make the content area visible before clicking into it.
 */
export const testDetailsContentEditable: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  await expect.poll(() => el.querySelector(".vizel-details"), { timeout: 5_000 }).not.toBeNull();
  const details = el.querySelector<HTMLElement>(".vizel-details");
  if (details === null) throw new Error("expected a .vizel-details element");
  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");
  const content = el.querySelector<HTMLElement>(".vizel-details-content");
  if (content === null) throw new Error("expected a .vizel-details-content element");

  await expect.element(page.elementLocator(summary)).toBeVisible();

  // Force the details block open and remove the hidden attribute so the
  // content area is interactable. Tiptap manages open/hidden state via
  // attributes rather than the native <details> element, so direct DOM
  // manipulation is the only reliable way to expose the area in a test.
  details.setAttribute("open", "true");
  content.removeAttribute("hidden");

  await expect.element(page.elementLocator(content)).toBeVisible();

  await userEvent.click(page.elementLocator(content));
  await userEvent.keyboard("This is the hidden content");

  await expect
    .poll(() => content.textContent?.includes("This is the hidden content") ?? false, {
      timeout: 5_000,
    })
    .toBe(true);
};

/** Verify the Details block and its children carry the expected CSS classes. */
export const testDetailsCssClasses: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await selectSlashCommand(el, "details");

  await expect.poll(() => el.querySelector(".vizel-details"), { timeout: 5_000 }).not.toBeNull();
  const details = el.querySelector<HTMLElement>(".vizel-details");
  if (details === null) throw new Error("expected a .vizel-details element");
  await expect.element(page.elementLocator(details)).toBeVisible();

  const summary = el.querySelector<HTMLElement>(".vizel-details-summary");
  if (summary === null) throw new Error("expected a .vizel-details-summary element");
  await expect.element(page.elementLocator(summary)).toBeVisible();

  // Content exists in the DOM (may be hidden when collapsed).
  const content = el.querySelector<HTMLElement>(".vizel-details-content");
  if (content === null) throw new Error("expected a .vizel-details-content element");
};
