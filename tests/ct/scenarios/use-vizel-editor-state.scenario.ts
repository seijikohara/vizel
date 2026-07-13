import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears.
// Allow a generous window: the full three-browser matrix runs nine browser
// instances in parallel, and under contention the async mount can exceed
// the default 1 s poll budget.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve a [data-testid] element rendered by the fixture. The element
// appears synchronously once the fixture mounts, but the reactive value
// inside it updates only after Tiptap's async onCreate fires, so callers
// should poll the text content rather than reading once.
async function resolveTestId(testId: string): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(`[data-testid="${testId}"]`), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`expected [data-testid="${testId}"]`);
  return el;
}

/**
 * Verify the selector receives the editor instance once the provider mounts.
 *
 * `useVizelEditorState` (and the Vue/Svelte equivalents) build the Tiptap
 * instance asynchronously, so the assertion polls the `editor-ready` flag
 * rather than reading once.
 */
export const testSelectorReceivesEditorOnMount: VizelBcScenario = async () => {
  const ready = await resolveTestId("editor-ready");
  await expect.poll(() => ready.textContent, { timeout: 10_000 }).toBe("true");
};

/**
 * Verify the selector re-runs on every Tiptap transaction.
 *
 * The fixture exposes a `selector-runs` counter that increments inside the
 * selector body. Typing a character must drive the counter up, proving the
 * subscription path through `transaction` / `selectionUpdate` stays wired.
 */
export const testSelectorRerunsOnTransaction: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const runs = await resolveTestId("selector-runs");

  // The counter starts at 0 and should be visible before interaction.
  await expect.element(page.elementLocator(runs)).toBeVisible();
  const initial = Number(runs.textContent);

  await userEvent.click(page.elementLocator(editorEl));
  await userEvent.keyboard("a");

  // The selector must re-evaluate at least once per transaction, so the
  // counter strictly exceeds the pre-typing value.
  await expect.poll(() => Number(runs.textContent), { timeout: 5_000 }).toBeGreaterThan(initial);
};

/**
 * Verify the selector reads the transaction off the snapshot.
 *
 * The fixture renders a `has-transaction` flag derived from
 * `snapshot.transaction`. The flag starts `false` because no transaction has
 * fired before the first keystroke, then flips to `true` once typing
 * dispatches the first Tiptap transaction.
 */
export const testSelectorReadsTransaction: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const ready = await resolveTestId("editor-ready");
  const hasTransaction = await resolveTestId("has-transaction");

  // Wait for the editor to mount. No transaction has fired yet, so the
  // snapshot still carries `transaction: null`.
  await expect.poll(() => ready.textContent, { timeout: 10_000 }).toBe("true");
  expect(hasTransaction.textContent).toBe("false");

  // Typing dispatches the first transaction, so the snapshot now carries a
  // non-null transaction the selector reads.
  await userEvent.click(page.elementLocator(editorEl));
  await userEvent.keyboard("a");
  await expect.poll(() => hasTransaction.textContent, { timeout: 5_000 }).toBe("true");
};

/**
 * Verify `equalityFn` short-circuits downstream re-renders when the
 * projection is structurally identical.
 *
 * The fixture maps the selector onto a constant projection once the editor is
 * ready and counts how many times the consumer effect re-runs. The counter
 * must stay flat across keystrokes even though the underlying selector still
 * executes.
 */
export const testEqualityFnShortCircuitsConsumer: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const ready = await resolveTestId("editor-ready");
  const consumerRuns = await resolveTestId("consumer-runs");

  // Wait for the editor to mount so the projection transitions from its
  // pre-mount value to the post-mount one. The pre-mount transition is the
  // only legitimate change; everything after must be short-circuited.
  await expect.poll(() => ready.textContent, { timeout: 10_000 }).toBe("true");
  await expect.element(page.elementLocator(consumerRuns)).toBeVisible();
  const initial = Number(consumerRuns.textContent);

  await userEvent.click(page.elementLocator(editorEl));
  await userEvent.keyboard("abcde");

  // The consumer projection is a frozen tuple, so `equalityFn` (shallow
  // tuple compare) reports equality on every transaction. The consumer-effect
  // counter therefore stays at its initial value regardless of keystrokes.
  await expect.poll(() => Number(consumerRuns.textContent), { timeout: 5_000 }).toBe(initial);
};
