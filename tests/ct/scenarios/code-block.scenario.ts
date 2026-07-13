import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

const CODE_BLOCK_SELECTOR = ".vizel-code-block";
const LANGUAGE_INPUT_SELECTOR = ".vizel-code-block-language-input";
const LINE_NUMBERS_TOGGLE_SELECTOR = ".vizel-code-block-line-numbers-toggle";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears rather than
// querying once. `.vizel-editor` is a div, not an ARIA textbox, so it is
// queried by class.
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

// Open the slash menu and insert a code block. The slash menu is a portal
// rendered to document.body, so it is queried from the document rather than
// the component root. The `[data-vizel-slash-menu]` attribute identifies the
// mounted portal regardless of class name.
async function insertCodeBlock(): Promise<void> {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("/code");

  // Slash menu renders to body as a portal; poll until visible.
  await expect
    .poll(() => document.querySelector("[data-vizel-slash-menu]"), { timeout: 5_000 })
    .not.toBeNull();
  await userEvent.keyboard("{Enter}");

  // Wait for the code block node to appear in the editor DOM.
  await expect
    .poll(() => document.querySelector(CODE_BLOCK_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
}

/** Verify a code block can be inserted via the slash command. */
export const testCodeBlockInsert: VizelBcScenario = async () => {
  await insertCodeBlock();

  const codeBlock = document.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (codeBlock === null) throw new Error("expected a code block element");
  await expect.element(page.elementLocator(codeBlock)).toBeVisible();
};

/** Verify the code block renders a language selector input. */
export const testCodeBlockHasLanguageSelector: VizelBcScenario = async () => {
  await insertCodeBlock();

  const languageInput = document.querySelector<HTMLElement>(LANGUAGE_INPUT_SELECTOR);
  if (languageInput === null) throw new Error("expected a language input element");
  await expect.element(page.elementLocator(languageInput)).toBeVisible();
};

/** Verify the language input accepts a new value. */
export const testCodeBlockLanguageChange: VizelBcScenario = async () => {
  await insertCodeBlock();

  const languageInput = document.querySelector<HTMLInputElement>(LANGUAGE_INPUT_SELECTOR);
  if (languageInput === null) throw new Error("expected a language input element");
  const inputLocator = page.elementLocator(languageInput);
  await userEvent.click(inputLocator);
  await userEvent.fill(inputLocator, "python");
  // Move focus away to trigger blur so the editor processes the new language.
  await userEvent.keyboard("{Tab}");

  await expect.element(inputLocator).toHaveValue("python");
};

/** Verify pressing Enter in the language input does not insert a newline in the code block. */
export const testCodeBlockLanguageInputEnterKey: VizelBcScenario = async () => {
  await insertCodeBlock();

  // Type a line of code before interacting with the language input so the
  // initial content is known.
  await userEvent.keyboard("line1");

  const codeBlock = document.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (codeBlock === null) throw new Error("expected a code block element");
  const code = codeBlock.querySelector("code");
  if (code === null) throw new Error("expected a code element inside the code block");
  const initialContent = code.textContent;

  const languageInput = document.querySelector<HTMLInputElement>(LANGUAGE_INPUT_SELECTOR);
  if (languageInput === null) throw new Error("expected a language input element");
  const inputLocator = page.elementLocator(languageInput);
  await userEvent.click(inputLocator);
  await userEvent.fill(inputLocator, "typescript");
  await userEvent.keyboard("{Enter}");

  // The language was accepted.
  await expect.element(inputLocator).toHaveValue("typescript");

  // No newline was appended to the code block: strict equality to detect
  // whitespace changes.
  await expect.poll(() => code.textContent, { timeout: 5_000 }).toBe(initialContent ?? "");
};

/** Verify the code block renders a line-numbers toggle button. */
export const testCodeBlockHasLineNumbersToggle: VizelBcScenario = async () => {
  await insertCodeBlock();

  const toggleButton = document.querySelector<HTMLElement>(LINE_NUMBERS_TOGGLE_SELECTOR);
  if (toggleButton === null) throw new Error("expected a line-numbers toggle button element");
  await expect.element(page.elementLocator(toggleButton)).toBeVisible();
};

/** Verify the toggle button adds and removes the line-numbers class on the code block. */
export const testCodeBlockLineNumbersToggle: VizelBcScenario = async () => {
  await insertCodeBlock();

  const codeBlock = document.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (codeBlock === null) throw new Error("expected a code block element");
  const toggleButton = document.querySelector<HTMLElement>(LINE_NUMBERS_TOGGLE_SELECTOR);
  if (toggleButton === null) throw new Error("expected a line-numbers toggle button element");

  // The code block initially has no line-numbers class.
  expect(codeBlock.classList.contains("vizel-code-block-line-numbers")).toBe(false);

  // First click enables line numbers.
  await userEvent.click(page.elementLocator(toggleButton));
  await expect
    .poll(() => codeBlock.classList.contains("vizel-code-block-line-numbers"), { timeout: 5_000 })
    .toBe(true);

  // Second click disables line numbers.
  await userEvent.click(page.elementLocator(toggleButton));
  await expect
    .poll(() => codeBlock.classList.contains("vizel-code-block-line-numbers"), { timeout: 5_000 })
    .toBe(false);
};

/** Verify code typed after inserting the block appears in the code element. */
export const testCodeBlockTyping: VizelBcScenario = async () => {
  await insertCodeBlock();

  const codeBlock = document.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (codeBlock === null) throw new Error("expected a code block element");
  const code = codeBlock.querySelector("code");
  if (code === null) throw new Error("expected a code element inside the code block");

  await userEvent.keyboard('const hello = "world";');

  await expect.element(page.elementLocator(code)).toHaveTextContent('const hello = "world";');
};

/**
 * Verify lowlight applies syntax-highlighting decoration after the language is set.
 *
 * Lowlight attaches ProseMirror decorations asynchronously after each
 * transaction, so the test polls for `hljs-*` elements rather than asserting
 * synchronously. The generous timeout covers the full contended nine-instance
 * matrix.
 */
export const testCodeBlockSyntaxHighlighting: VizelBcScenario = async () => {
  await insertCodeBlock();

  const codeBlock = document.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (codeBlock === null) throw new Error("expected a code block element");

  // Set the language before typing so lowlight recognises the syntax.
  const languageInput = document.querySelector<HTMLInputElement>(LANGUAGE_INPUT_SELECTOR);
  if (languageInput === null) throw new Error("expected a language input element");
  const inputLocator = page.elementLocator(languageInput);
  await userEvent.click(inputLocator);
  await userEvent.fill(inputLocator, "javascript");
  await expect.element(inputLocator).toHaveValue("javascript");

  // Return focus to the editor and type code for lowlight to highlight. Click
  // the `pre` element, not the `.vizel-code-block` wrapper: the wrapper also
  // spans the language toolbar, so a wrapper click can land outside the
  // editable region and leave the caret unset on Firefox, which then drops
  // the typed keystrokes. The empty `code` contentDOM has zero size and is
  // not clickable, but its `pre` parent has padding and stays clickable.
  const pre = codeBlock.querySelector("pre");
  if (pre === null) throw new Error("expected a pre element inside the code block");
  await userEvent.click(page.elementLocator(pre));
  await userEvent.keyboard("const x = 42;");

  const code = codeBlock.querySelector("code");
  if (code === null) throw new Error("expected a code element inside the code block");
  await expect.element(page.elementLocator(code)).toHaveTextContent("const x = 42;");

  // Poll for hljs decoration elements: lowlight applies them in a deferred
  // async step and the timer can be slow under parallel browser contention.
  await expect
    .poll(() => codeBlock.querySelectorAll("[class^='hljs-']").length, { timeout: 10_000 })
    .toBeGreaterThan(0);
};
