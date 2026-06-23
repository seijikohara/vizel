import { expect } from "vitest";
import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears to avoid a
// race with the async mount under the nine-instance contention budget.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve a button by data-testid. Buttons render at fixture mount time, so
// a short poll budget suffices.
async function resolveButton(testId: string): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(`[data-testid="${testId}"]`), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`expected [data-testid="${testId}"]`);
  return el;
}

// ============================================================================
// Empty State Edge Cases
// ============================================================================

/** Verify the empty editor has the correct initial DOM state. */
export const testEditorEmptyState: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  // An empty Tiptap document renders exactly one paragraph.
  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(1);

  // The Placeholder extension marks the sole empty paragraph with this class.
  await expect
    .poll(() => el.querySelector("p")?.classList.contains("vizel-node-empty") ?? false, {
      timeout: 5_000,
    })
    .toBe(true);
};

/** Verify the empty editor exports empty or near-empty Markdown. */
export const testMarkdownEmptyExport: VizelBcScenario = async () => {
  await resolveEditor();

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  // Empty editor may produce an empty string or "&nbsp;" depending on the browser.
  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toMatch(/^(\s*|&nbsp;)$/);
};

// ============================================================================
// Special Characters Edge Cases
// ============================================================================

/** Verify the editor accepts Unicode and emoji characters without corruption. */
export const testSpecialCharacters: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  // Paste via ClipboardEvent rather than simulating keypresses: userEvent.type
  // and userEvent.keyboard both process each codeunit separately and corrupt
  // surrogate pairs (emoji) into U+FFFD replacement characters. A paste event
  // delivers the full string to ProseMirror's clipboard handler, matching how
  // real browser emoji keyboard input arrives.
  const text = "日本語テスト emoji: 🎉🚀 symbols: ©®™";
  const dt = new DataTransfer();
  dt.setData("text/plain", text);
  el.dispatchEvent(
    new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })
  );

  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("日本語テスト");
  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("🎉🚀");
  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("©®™");
};

/** Verify angle brackets and ampersands are stored as text, not rendered as HTML. */
export const testHtmlEscaping: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Type raw angle brackets — Tiptap's schema must treat them as text nodes,
  // not inject a live <script> element into the DOM.
  await userEvent.keyboard("<script>alert(1)</script> & test");

  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("<script>");
  await expect.poll(() => el.textContent ?? "").toContain("</script>");
  await expect.poll(() => el.textContent ?? "").toContain("& test");

  // No actual script element must exist inside the editor.
  expect(el.querySelectorAll("script").length).toBe(0);

  // The text is inside a paragraph, not a rendered HTML structure.
  const paragraph = el.querySelector("p");
  if (paragraph === null) throw new Error("expected a paragraph in the editor");
  expect(paragraph.textContent).toContain("<script>alert(1)</script>");
};

// ============================================================================
// Undo/Redo Composite Operations
// ============================================================================

/** Verify undo and redo cycle correctly across a bold formatting operation. */
export const testUndoRedoFormatting: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("Hello World");

  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("Hello World");

  // Select all and apply bold.
  await pressKeyChord("Mod", "a");
  await pressKeyChord("Mod", "b");

  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Hello World");

  // Undo bold — the <strong> must disappear while the text remains.
  await pressKeyChord("Mod", "z");
  await expect.poll(() => el.querySelectorAll("strong").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => el.textContent ?? "").toContain("Hello World");

  // Redo bold — the <strong> must reappear.
  await pressKeyChord("Mod", "Shift", "z");
  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Hello World");
};

/** Verify sequential undo correctly reverses each formatting step. */
export const testUndoMultipleOperations: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("Hello");

  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("Hello");

  // Apply bold.
  await pressKeyChord("Mod", "a");
  await pressKeyChord("Mod", "b");
  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Hello");

  // Apply italic on top of bold.
  await pressKeyChord("Mod", "i");
  await expect.poll(() => el.querySelector("em"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelector("em")?.textContent ?? "").toContain("Hello");

  // Undo italic — em disappears, strong remains.
  await pressKeyChord("Mod", "z");
  await expect.poll(() => el.querySelectorAll("em").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => el.querySelector("strong")?.textContent ?? "").toContain("Hello");

  // Undo bold — strong disappears, text remains.
  await pressKeyChord("Mod", "z");
  await expect.poll(() => el.querySelectorAll("strong").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => el.textContent ?? "").toContain("Hello");
};

// ============================================================================
// Rapid Operations Edge Cases
// ============================================================================

/**
 * Verify rapid bold toggles do not corrupt the editor state.
 *
 * Five toggles (odd count) must leave bold active; one more toggle turns it off.
 * The regression target is ProseMirror losing track of mark state under rapid
 * command dispatch.
 */
export const testRapidFormattingToggles: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("Test");
  await pressKeyChord("Mod", "a");

  // Toggle bold five times (odd count → bold active).
  for (let i = 0; i < 5; i++) {
    await pressKeyChord("Mod", "b");
  }

  await expect.poll(() => el.querySelector("strong"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelector("strong")?.textContent ?? "").toContain("Test");

  // One more toggle (even count → bold off).
  await pressKeyChord("Mod", "b");
  await expect.poll(() => el.querySelectorAll("strong").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => el.textContent ?? "").toContain("Test");
};

// ============================================================================
// Markdown Edge Cases
// ============================================================================

/** Verify the Markdown export preserves Unicode and emoji characters. */
export const testMarkdownSpecialCharsExport: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  // Use a paste ClipboardEvent for the same reason as testSpecialCharacters:
  // emoji require full-string delivery to avoid surrogate-pair corruption.
  const text = "Special: 日本語 🎉 ©";
  const dt = new DataTransfer();
  dt.setData("text/plain", text);
  el.dispatchEvent(
    new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })
  );

  await expect.poll(() => el.textContent ?? "", { timeout: 5_000 }).toContain("日本語");

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain("日本語");
  await expect.poll(() => output.textContent ?? "").toContain("🎉");
};

/** Verify Markdown import renders a blockquote node correctly. */
export const testMarkdownNestedContent: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  // The fixture button imports "> This is a quote" as Markdown.
  const importButton = await resolveButton("import-blockquote-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("blockquote"), { timeout: 5_000 }).not.toBeNull();

  const blockquote = el.querySelector<HTMLElement>("blockquote");
  if (blockquote === null) throw new Error("expected a blockquote element");
  await expect.element(page.elementLocator(blockquote)).toBeVisible();
  expect(blockquote.textContent).toContain("This is a quote");
};
