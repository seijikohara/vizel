import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Verify the selector receives the editor instance once the provider
 * mounts. `createVizelEditor` (and the React / Vue equivalents) build
 * the Tiptap instance asynchronously, so the assertion polls the
 * `editor-ready` flag rather than reading it once.
 */
export async function testSelectorReceivesEditorOnMount(
  component: Locator,
  _page: Page
): Promise<void> {
  const ready = component.locator("[data-testid='editor-ready']");
  await expect(ready).toHaveText("true", { timeout: 10_000 });
}

/**
 * Verify the selector re-runs on every Tiptap transaction. The
 * fixture exposes a `selector-runs` counter that bumps inside the
 * selector body; typing a character must drive the counter up so the
 * subscription path through `transaction` / `selectionUpdate` stays
 * wired.
 */
export async function testSelectorRerunsOnTransaction(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const runs = component.locator("[data-testid='selector-runs']");

  await expect(runs).toBeVisible();
  const initial = Number(await runs.textContent());

  await editor.click();
  await page.keyboard.type("a");

  // The selector must re-evaluate at least once per transaction, so
  // the counter strictly exceeds the pre-typing value.
  await expect.poll(async () => Number(await runs.textContent())).toBeGreaterThan(initial);
}

/**
 * Verify the selector reads the transaction off the snapshot. The
 * fixture renders a `has-transaction` flag derived from
 * `snapshot.transaction`. The flag starts `false` because no
 * transaction has fired before the first keystroke, then flips to
 * `true` once typing dispatches the first Tiptap transaction. The
 * assertion runs identically across React, Vue, and Svelte, proving
 * every adapter's selector now receives the transaction.
 */
export async function testSelectorReadsTransaction(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const ready = component.locator("[data-testid='editor-ready']");
  const hasTransaction = component.locator("[data-testid='has-transaction']");

  // Wait for the editor to mount; no transaction has fired yet, so the
  // snapshot still carries `transaction: null`.
  await expect(ready).toHaveText("true", { timeout: 10_000 });
  await expect(hasTransaction).toHaveText("false");

  // Typing dispatches the first transaction, so the snapshot now
  // carries a non-null transaction the selector reads.
  await editor.click();
  await page.keyboard.type("a");
  await expect(hasTransaction).toHaveText("true");
}

/**
 * Verify `equalityFn` short-circuits downstream re-renders when the
 * projection is structurally identical. The fixture maps the selector
 * onto a constant projection once the editor is ready and counts how
 * many times the consumer effect re-runs; the counter must stay flat
 * across keystrokes even though the underlying selector still executes.
 */
export async function testEqualityFnShortCircuitsConsumer(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const ready = component.locator("[data-testid='editor-ready']");
  const consumerRuns = component.locator("[data-testid='consumer-runs']");

  // Wait for the editor to mount so the projection transitions from
  // its pre-mount value to the post-mount one before the snapshot.
  // The pre-mount transition is the only legitimate change for this
  // selector; everything after must be short-circuited.
  await expect(ready).toHaveText("true", { timeout: 10_000 });
  await expect(consumerRuns).toBeVisible();
  const initial = Number(await consumerRuns.textContent());

  await editor.click();
  await page.keyboard.type("abcde");

  // The consumer projection is a frozen tuple, so `equalityFn`
  // (shallow tuple compare) reports equality on every transaction.
  // The consumer-effect counter therefore stays at its initial value
  // regardless of how many keystrokes the user types.
  await expect(consumerRuns).toHaveText(String(initial));
}
