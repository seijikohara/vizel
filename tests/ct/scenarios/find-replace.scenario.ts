import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared, framework-agnostic scenarios for the find-and-replace panel.
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

const openReplacePanel = async (component: Locator): Promise<void> => {
  // The editor mounts asynchronously (immediatelyRender: false), so wait for its
  // content before triggering the open command — clicking earlier no-ops against
  // a still-null editor and the panel never appears.
  await expect(component.locator(EDITOR)).toContainText("alpha");
  await component.locator("[data-testid='open-replace']").click();
  await expect(component.locator(PANEL)).toBeVisible();
};

/** Verify the panel opens in replace mode with both rows present. */
export async function testFindReplaceOpens(component: Locator, _page: Page): Promise<void> {
  await openReplacePanel(component);
  // Find-row input plus replace-row input.
  await expect(component.locator(INPUT)).toHaveCount(2);
}

/** Verify the two replace buttons render the localized labels, not a bare "All". */
export async function testReplaceButtonsAreLocalized(
  component: Locator,
  _page: Page
): Promise<void> {
  await openReplacePanel(component);
  await expect(component.getByRole("button", { name: "Replace", exact: true })).toBeVisible();
  await expect(component.getByRole("button", { name: "Replace all", exact: true })).toBeVisible();
}

/** Verify typing a term highlights every match and reports the count. */
export async function testFindReportsMatchCount(component: Locator, _page: Page): Promise<void> {
  await openReplacePanel(component);
  await component.locator(INPUT).first().fill("alpha");
  await expect(component.locator(COUNT)).toContainText("3");
}

/** Verify "Replace" swaps a single match and leaves the rest. */
export async function testReplaceOne(component: Locator, _page: Page): Promise<void> {
  await openReplacePanel(component);
  await component.locator(INPUT).first().fill("alpha");
  await component.locator(INPUT).nth(1).fill("ZULU");
  await component.getByRole("button", { name: "Replace", exact: true }).click();

  await expect(component.locator(EDITOR)).toContainText("ZULU");
  // Two "alpha" occurrences remain after replacing one.
  await expect(component.locator(COUNT)).toContainText("2");
}

/** Verify "Replace all" swaps every remaining match. */
export async function testReplaceAll(component: Locator, _page: Page): Promise<void> {
  await openReplacePanel(component);
  await component.locator(INPUT).first().fill("alpha");
  await component.locator(INPUT).nth(1).fill("ZULU");
  await component.getByRole("button", { name: "Replace all", exact: true }).click();

  const editor = component.locator(EDITOR);
  await expect(editor).not.toContainText("alpha");
  await expect(editor).toContainText("ZULU");
}
