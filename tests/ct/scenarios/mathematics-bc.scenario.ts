import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for Mathematics (LaTeX) support.
 *
 * Math blocks and inline math nodes render inside the editor component tree, so
 * queries target document directly. The slash menu that the insertion helpers use
 * renders to document.body as a portal, so it is queried via document too.
 */

const EDITOR = ".vizel-editor";
const SLASH_MENU = "[data-vizel-slash-menu]";
const MATH_BLOCK = ".vizel-math-block";
const MATH_INLINE = ".vizel-math-inline";
const MATH_RENDER = ".vizel-math-render";
const MATH_TEXTAREA = ".vizel-math-textarea";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and the asynchronous Tiptap mount can exceed the
  // default 1 s poll budget under that contention.
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Click the editor to focus it and dismiss any open menus.
async function clickEditor(): Promise<HTMLElement> {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));
  // Dismiss any bubble menu that appeared on the initial click.
  await userEvent.keyboard("{Escape}");
  return el;
}

// Open the slash menu, type a query, then press Enter to insert the first match.
// Polls for the menu to appear before pressing Enter.
async function insertViaSlashMenu(query: string): Promise<void> {
  await clickEditor();
  await userEvent.keyboard(`/${query}`);
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");
}

// Wait for the math block to appear in the DOM, then wait for KaTeX to render
// its initial output into the render container. KaTeX renders asynchronously
// via a promise, so the render container may be empty immediately after insertion.
async function resolveMathBlock(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector(MATH_BLOCK), { timeout: 5_000 }).not.toBeNull();
  const mathBlock = document.querySelector<HTMLElement>(MATH_BLOCK);
  if (mathBlock === null) throw new Error("expected a .vizel-math-block element");
  // Wait for the async KaTeX render to populate the render container.
  await expect.poll(() => mathBlock.querySelector(MATH_RENDER), { timeout: 5_000 }).not.toBeNull();
  return mathBlock;
}

/** Verify a math block can be inserted via the slash command "/math". */
export const testMathBlockInsert: VizelBcScenario = async () => {
  await insertViaSlashMenu("math");
  const mathBlock = await resolveMathBlock();
  // The node is present in the DOM — confirm the outer element exists and is
  // attached; toBeVisible() can fail before KaTeX fills the element with content
  // so we assert on DOM presence instead.
  expect(document.contains(mathBlock)).toBe(true);
};

/** Verify inline math can be inserted via the slash command "/inline". */
export const testInlineMathInsert: VizelBcScenario = async () => {
  await insertViaSlashMenu("inline");
  await expect.poll(() => document.querySelector(MATH_INLINE), { timeout: 5_000 }).not.toBeNull();
  const mathInline = document.querySelector<HTMLElement>(MATH_INLINE);
  if (mathInline === null) throw new Error("expected a .vizel-math-inline element");
  expect(document.contains(mathInline)).toBe(true);
};

/** Verify clicking the math block render area opens the textarea for editing. */
export const testMathBlockClickToEdit: VizelBcScenario = async () => {
  await insertViaSlashMenu("math");
  const mathBlock = await resolveMathBlock();

  // Dispatch a native click on the render container to trigger startEditing.
  // userEvent.click requires the element to be visible; the render container
  // may have no CSS-computed height without the stylesheet, so dispatch directly.
  const renderContainer = mathBlock.querySelector<HTMLElement>(MATH_RENDER);
  if (renderContainer === null) throw new Error("expected a .vizel-math-render element");
  renderContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  // The textarea becomes visible once the block enters editing mode.
  await expect.poll(() => document.querySelector(MATH_TEXTAREA), { timeout: 5_000 }).not.toBeNull();
  const textarea = document.querySelector<HTMLTextAreaElement>(MATH_TEXTAREA);
  if (textarea === null) throw new Error("expected a .vizel-math-textarea element");
  // In editing mode the edit container is shown and the textarea is inside it.
  expect(document.contains(textarea)).toBe(true);
};

/**
 * Verify LaTeX typed into the math block textarea triggers KaTeX rendering.
 *
 * The textarea's `input` event drives the live preview; blurring the textarea
 * calls `stopEditing`, which saves the LaTeX and re-renders the main container.
 * The test sets the value directly and dispatches `input` to replicate
 * the Playwright `textarea.evaluate` approach without `page.evaluate`.
 */
export const testMathBlockTyping: VizelBcScenario = async () => {
  await insertViaSlashMenu("math");
  const mathBlock = await resolveMathBlock();

  const renderContainer = mathBlock.querySelector<HTMLElement>(MATH_RENDER);
  if (renderContainer === null) throw new Error("expected a .vizel-math-render element");
  renderContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  await expect.poll(() => document.querySelector(MATH_TEXTAREA), { timeout: 5_000 }).not.toBeNull();
  const textarea = document.querySelector<HTMLTextAreaElement>(MATH_TEXTAREA);
  if (textarea === null) throw new Error("expected a .vizel-math-textarea element");

  // Set value and dispatch input to trigger the live-preview handler, then blur
  // to commit the LaTeX and re-render the KaTeX output.
  textarea.focus();
  textarea.value = "E = mc^2";
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.blur();

  // Poll for the KaTeX output element that the async renderKatex writes.
  await expect
    .poll(() => mathBlock.querySelector(".vizel-math-render .katex"), { timeout: 10_000 })
    .not.toBeNull();
  const katexEl = mathBlock.querySelector<HTMLElement>(".vizel-math-render .katex");
  if (katexEl === null) throw new Error("expected a .katex element inside .vizel-math-render");
  expect(document.contains(katexEl)).toBe(true);
};

/**
 * Verify the $...$ input rule creates an inline math element.
 *
 * ProseMirror's InputRule fires after the closing `$` is typed. The rule
 * replaces the `$E=mc^2$` text span with a `mathInline` node.
 * `$` is not a special character in userEvent, so no escaping is needed.
 */
export const testInlineMathInputRule: VizelBcScenario = async () => {
  await clickEditor();
  await userEvent.keyboard("$E=mc^2$");

  await expect.poll(() => document.querySelector(MATH_INLINE), { timeout: 5_000 }).not.toBeNull();
  const mathInline = document.querySelector<HTMLElement>(MATH_INLINE);
  if (mathInline === null) throw new Error("expected a .vizel-math-inline element");
  expect(document.contains(mathInline)).toBe(true);
};

/**
 * Verify KaTeX renders the math expression including special symbols.
 *
 * After typing LaTeX with a sum expression, KaTeX produces both a `.katex`
 * wrapper and a `.katex-html` subtree. Both must be present once rendering
 * completes.
 */
export const testKaTeXRendering: VizelBcScenario = async () => {
  await insertViaSlashMenu("math");
  const mathBlock = await resolveMathBlock();

  const renderContainer = mathBlock.querySelector<HTMLElement>(MATH_RENDER);
  if (renderContainer === null) throw new Error("expected a .vizel-math-render element");
  renderContainer.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  await expect.poll(() => document.querySelector(MATH_TEXTAREA), { timeout: 5_000 }).not.toBeNull();
  const textarea = document.querySelector<HTMLTextAreaElement>(MATH_TEXTAREA);
  if (textarea === null) throw new Error("expected a .vizel-math-textarea element");

  // Trigger the live-preview handler with a multi-symbol expression, then blur
  // to commit. The async renderKatex writes both .katex and .katex-html.
  textarea.focus();
  textarea.value = "\\sum_{i=1}^{n} i";
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.blur();

  await expect
    .poll(() => mathBlock.querySelector(".vizel-math-render .katex"), { timeout: 10_000 })
    .not.toBeNull();
  const katexEl = mathBlock.querySelector<HTMLElement>(".vizel-math-render .katex");
  if (katexEl === null) throw new Error("expected a .katex element inside .vizel-math-render");
  expect(document.contains(katexEl)).toBe(true);

  await expect
    .poll(() => mathBlock.querySelector(".vizel-math-render .katex-html"), { timeout: 10_000 })
    .not.toBeNull();
  const katexHtml = mathBlock.querySelector<HTMLElement>(".vizel-math-render .katex-html");
  if (katexHtml === null)
    throw new Error("expected a .katex-html element inside .vizel-math-render");
  expect(document.contains(katexHtml)).toBe(true);
};
