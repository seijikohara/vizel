import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for the find-and-replace
 * panel.
 *
 * Each fixture mounts an editor preloaded with the paragraph
 * "alpha beta alpha gamma alpha" (the term "alpha" appears three times) plus a
 * `[data-testid="open-replace"]` button that opens the panel in replace mode
 * through `editor.commands.openFindReplace("replace")`. The replacement term
 * "ZULU" shares no substring with "alpha", so a case-insensitive match count
 * drops cleanly as occurrences are replaced.
 */

const PANEL = ".vizel-find-replace-panel";
const INPUT = ".vizel-find-replace-input";
const COUNT = ".vizel-find-replace-count";
const EDITOR = ".vizel-editor";

// Wait for the editor content to appear, then click the open-replace button and
// wait for the panel to become visible. The editor mounts asynchronously
// (`immediatelyRender: false`), so polling for editor content before clicking
// prevents the button click from no-oping against an uninitialized editor.
async function openReplacePanel(): Promise<void> {
  await expect
    .poll(() => document.querySelector<HTMLElement>(EDITOR)?.textContent?.includes("alpha"), {
      timeout: 15_000,
    })
    .toBe(true);

  const openBtn = document.querySelector<HTMLElement>("[data-testid='open-replace']");
  if (openBtn === null) throw new Error("expected [data-testid='open-replace'] button");
  await userEvent.click(page.elementLocator(openBtn));

  await expect.poll(() => document.querySelector(PANEL), { timeout: 5_000 }).not.toBeNull();
}

// Find the first button inside the panel whose accessible name matches `name`.
// Playwright's `getByRole("button", { name })` checks the accessible name
// (aria-label, visible text, etc.). Here we scan `<button>` elements by
// their trimmed textContent since the panel renders visible button labels.
function findButtonByLabel(label: string): HTMLElement | null {
  const buttons = document.querySelectorAll<HTMLElement>(`${PANEL} button`);
  for (const btn of buttons) {
    if (btn.textContent?.trim() === label) return btn;
  }
  return null;
}

/** Verify the panel opens in replace mode with both input rows present. */
export const testFindReplaceOpens: VizelBcScenario = async () => {
  await openReplacePanel();
  // Replace mode renders two rows: the find input and the replace input.
  await expect.poll(() => document.querySelectorAll(INPUT).length, { timeout: 5_000 }).toBe(2);
};

/** Verify the two replace buttons render localized labels, not a bare "All". */
export const testReplaceButtonsAreLocalized: VizelBcScenario = async () => {
  await openReplacePanel();
  await expect.poll(() => findButtonByLabel("Replace"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => findButtonByLabel("Replace all"), { timeout: 5_000 }).not.toBeNull();
};

/** Verify typing a term highlights every match and reports the count. */
export const testFindReportsMatchCount: VizelBcScenario = async () => {
  await openReplacePanel();

  const inputs = document.querySelectorAll<HTMLElement>(INPUT);
  if (inputs.length === 0) throw new Error("expected at least one find-replace input");
  await userEvent.fill(page.elementLocator(inputs[0]), "alpha");

  await expect
    .poll(() => document.querySelector(COUNT)?.textContent?.includes("3"), { timeout: 5_000 })
    .toBe(true);
};

/** Verify "Replace" swaps a single match and leaves the remaining two. */
export const testReplaceOne: VizelBcScenario = async () => {
  await openReplacePanel();

  const inputs = document.querySelectorAll<HTMLElement>(INPUT);
  if (inputs.length < 2) throw new Error("expected two find-replace inputs");
  await userEvent.fill(page.elementLocator(inputs[0]), "alpha");
  await userEvent.fill(page.elementLocator(inputs[1]), "ZULU");

  const replaceBtn = findButtonByLabel("Replace");
  if (replaceBtn === null) throw new Error('expected a "Replace" button');
  await userEvent.click(page.elementLocator(replaceBtn));

  const editor = document.querySelector<HTMLElement>(EDITOR);
  if (editor === null) throw new Error("expected a .vizel-editor element");
  await expect.poll(() => editor.textContent?.includes("ZULU"), { timeout: 5_000 }).toBe(true);
  // Two "alpha" occurrences remain after replacing the first.
  await expect
    .poll(() => document.querySelector(COUNT)?.textContent?.includes("2"), { timeout: 5_000 })
    .toBe(true);
};

/** Verify "Replace all" swaps every remaining match. */
export const testReplaceAll: VizelBcScenario = async () => {
  await openReplacePanel();

  const inputs = document.querySelectorAll<HTMLElement>(INPUT);
  if (inputs.length < 2) throw new Error("expected two find-replace inputs");
  await userEvent.fill(page.elementLocator(inputs[0]), "alpha");
  await userEvent.fill(page.elementLocator(inputs[1]), "ZULU");

  const replaceAllBtn = findButtonByLabel("Replace all");
  if (replaceAllBtn === null) throw new Error('expected a "Replace all" button');
  await userEvent.click(page.elementLocator(replaceAllBtn));

  const editor = document.querySelector<HTMLElement>(EDITOR);
  if (editor === null) throw new Error("expected a .vizel-editor element");
  await expect
    .poll(() => editor.textContent?.includes("alpha") === false, { timeout: 5_000 })
    .toBe(true);
  await expect.poll(() => editor.textContent?.includes("ZULU"), { timeout: 5_000 }).toBe(true);
};
