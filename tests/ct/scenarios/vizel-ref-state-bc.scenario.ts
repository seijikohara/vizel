import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears. Allow 15 s: the full nine-instance matrix
// saturates the machine and the async mount can exceed the default 1 s budget.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve a [data-testid] counter element. The fixture renders these counts
// synchronously, but the editor state (which populates the counts) updates
// only after Tiptap's onCreate fires. Poll with a relaxed budget to avoid
// races when the browser is under load.
async function resolveCounter(testId: string): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(`[data-testid="${testId}"]`), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`expected [data-testid="${testId}"]`);
  return el;
}

/**
 * Verify character and word counts update after typing into an initially empty
 * editor.
 *
 * The Playwright original tests that `useState` (not `useRef`) triggers a
 * re-render after `onCreate`, so counts reflect the live editor state. Typing
 * "Hello World" must produce character count 11 and word count 2.
 */
export const testVizelRefStateCharacterCount: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const charCounter = await resolveCounter("character-count");
  const wordCounter = await resolveCounter("word-count");

  // Type into the empty editor so the reactive counts receive a transaction.
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.type(editorLocator, "Hello World");

  // Poll because the count elements update asynchronously via the framework's
  // reactive scheduler after the Tiptap transaction commits.
  await expect.poll(() => charCounter.textContent, { timeout: 5_000 }).toBe("11");
  await expect.poll(() => wordCounter.textContent, { timeout: 5_000 }).toBe("2");
};

/**
 * Verify character and word counts reflect the initial content on mount.
 *
 * The fixture initialises the editor with "Test content" (12 chars, 2 words).
 * With the `useRef` bug the counts would remain 0 because no re-render fires
 * after `onCreate`. The `useState` pattern being tested triggers the re-render.
 */
export const testVizelRefStateInitialContent: VizelBcScenario = async () => {
  await resolveEditor();
  const charCounter = await resolveCounter("character-count");
  const wordCounter = await resolveCounter("word-count");

  // Poll: the fixture's state update runs inside the React/Vue/Svelte scheduler
  // after the Tiptap onCreate callback fires, so the DOM reflects the initial
  // count only after the first post-mount flush.
  await expect.poll(() => charCounter.textContent, { timeout: 5_000 }).toBe("12");
  await expect.poll(() => wordCounter.textContent, { timeout: 5_000 }).toBe("2");
};

/**
 * Verify the character count updates when the user appends text to initial
 * content.
 *
 * Starting from "Test content" (12 chars), appending " more" must raise the
 * character count to 17. The word count is not checked here because the focus
 * is on reactive updates after user input.
 */
export const testVizelRefStateUpdatesOnChange: VizelBcScenario = async () => {
  const editorEl = await resolveEditor();
  const charCounter = await resolveCounter("character-count");

  // Confirm the initial count before interaction so a regression where both
  // the initial and the updated counts are wrong does not go undetected.
  await expect.poll(() => charCounter.textContent, { timeout: 5_000 }).toBe("12");

  // Move the caret to the end and append " more". The End key is sent via
  // userEvent.keyboard rather than page.keyboard.press, which is a Playwright API.
  const editorLocator = page.elementLocator(editorEl);
  await userEvent.click(editorLocator);
  await userEvent.keyboard("{End}");
  await userEvent.type(editorLocator, " more");

  await expect.poll(() => charCounter.textContent, { timeout: 5_000 }).toBe("17");
};
