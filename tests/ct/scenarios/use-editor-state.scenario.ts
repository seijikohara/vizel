import { expect } from "vitest";

import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears. `.vizel-editor` is a div, not an ARIA
// textbox, so the query uses a class selector.
async function resolveEditor(): Promise<HTMLElement> {
  // Use a generous window because the concurrent three-browser matrix saturates
  // the machine and can push the asynchronous Tiptap mount beyond the default 1s
  // poll budget.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve a data-testid element. Poll rather than read once because the fixture
// renders synchronously before Tiptap mounts, and the initial render may arrive
// before the browser paints the first frame.
async function resolveTestId(testId: string): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(`[data-testid="${testId}"]`), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`expected [data-testid="${testId}"]`);
  return el;
}

/**
 * Verify useVizelState increments the update counter when the editor state
 * changes. The counter starts at some initial value; typing text must produce a
 * different (higher) value because each Tiptap transaction fires an update event
 * that the state hook captures.
 */
export const testEditorStateUpdatesOnChange: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const updateCounter = await resolveTestId("update-count");

  const initialCount = updateCounter.textContent ?? "0";

  await userEvent.click(page.elementLocator(el));
  await userEvent.type(page.elementLocator(el), "Hello");

  // Each keystroke dispatches a Tiptap transaction; the counter must diverge.
  await expect.poll(() => updateCounter.textContent, { timeout: 5_000 }).not.toBe(initialCount);
};

/**
 * Verify useVizelState reflects bold mark activation. After selecting all text
 * and pressing Mod+B, the bold indicator must read "true"; pressing Mod+B again
 * must toggle it back to "false".
 */
export const testEditorStateTracksBoldActive: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const boldIndicator = await resolveTestId("bold-active");

  await userEvent.click(page.elementLocator(el));
  await userEvent.type(page.elementLocator(el), "Test text");
  await pressKeyChord("Mod", "a");

  await expect.poll(() => boldIndicator.textContent, { timeout: 5_000 }).toBe("false");

  await pressKeyChord("Mod", "b");
  await expect.poll(() => boldIndicator.textContent, { timeout: 5_000 }).toBe("true");

  await pressKeyChord("Mod", "b");
  await expect.poll(() => boldIndicator.textContent, { timeout: 5_000 }).toBe("false");
};

/**
 * Verify useVizelState reflects italic mark activation. After selecting all
 * text and pressing Mod+I, the italic indicator must read "true".
 */
export const testEditorStateTracksItalicActive: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const italicIndicator = await resolveTestId("italic-active");

  await userEvent.click(page.elementLocator(el));
  await userEvent.type(page.elementLocator(el), "Test text");
  await pressKeyChord("Mod", "a");

  await expect.poll(() => italicIndicator.textContent, { timeout: 5_000 }).toBe("false");

  await pressKeyChord("Mod", "i");
  await expect.poll(() => italicIndicator.textContent, { timeout: 5_000 }).toBe("true");
};

/**
 * Verify useVizelState behaves safely when the editor is null. The update
 * counter must read "0" because no transactions are dispatched without an
 * editor instance.
 */
export const testEditorStateWithNullEditor: VizelBcScenario = async () => {
  const updateCounter = await resolveTestId("update-count");
  // The fixture renders with nullEditor=true, so the counter stays at zero.
  await expect.element(page.elementLocator(updateCounter)).toHaveTextContent("0");
};

/**
 * Verify getVizelEditorState returns accurate character and word counts after
 * typing. The counts must update synchronously with each Tiptap transaction.
 */
export const testEditorStateCharacterCount: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const charCountEl = await resolveTestId("character-count");
  const wordCountEl = await resolveTestId("word-count");

  await expect.element(page.elementLocator(charCountEl)).toHaveTextContent("0");
  await expect.element(page.elementLocator(wordCountEl)).toHaveTextContent("0");

  await userEvent.click(page.elementLocator(el));
  await userEvent.type(page.elementLocator(el), "Hello World");

  await expect.poll(() => charCountEl.textContent, { timeout: 5_000 }).toBe("11");
  await expect.poll(() => wordCountEl.textContent, { timeout: 5_000 }).toBe("2");

  await userEvent.type(page.elementLocator(el), " Test");

  await expect.poll(() => charCountEl.textContent, { timeout: 5_000 }).toBe("16");
  await expect.poll(() => wordCountEl.textContent, { timeout: 5_000 }).toBe("3");
};

/**
 * Verify getVizelEditorState tracks the isEmpty and isFocused flags. The editor
 * starts empty and unfocused; clicking focuses it; typing clears isEmpty;
 * clicking outside blurs the editor.
 */
export const testEditorStateEmptyAndFocus: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const isEmptyEl = await resolveTestId("is-empty");
  const isFocusedEl = await resolveTestId("is-focused");

  await expect.element(page.elementLocator(isEmptyEl)).toHaveTextContent("true");
  await expect.element(page.elementLocator(isFocusedEl)).toHaveTextContent("false");

  await userEvent.click(page.elementLocator(el));
  await expect.poll(() => isFocusedEl.textContent, { timeout: 5_000 }).toBe("true");

  await userEvent.type(page.elementLocator(el), "Hello");
  await expect.poll(() => isEmptyEl.textContent, { timeout: 5_000 }).toBe("false");

  // Click outside the editor to trigger a blur event. The body is always present
  // and outside the editor subtree, so a click on it reliably blurs ProseMirror.
  await userEvent.click(page.elementLocator(document.body));
  await expect.poll(() => isFocusedEl.textContent, { timeout: 5_000 }).toBe("false");
};
