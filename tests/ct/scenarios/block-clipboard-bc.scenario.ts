import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Vitest Browser port of the block-aware clipboard scenarios.
 *
 * The fixtures expose the editor on `window.vizelTestEditor` so the scenarios
 * drive selection state through Tiptap's command bus; synthetic keystrokes for
 * `ControlOrMeta+Home` and similar chords behave differently across browsers.
 *
 * Clipboard interactions dispatch synthesized `ClipboardEvent`s carrying
 * `DataTransfer` payloads, because real navigator-level clipboard access is
 * gated by browser permissions.
 */

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears. `.vizel-editor` is a div, not an ARIA
// textbox, so the query uses a class selector.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the concurrent browser matrix saturates the
  // machine and the asynchronous Tiptap mount can exceed the default 1 s budget.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Minimal view of the editor instance the fixtures publish on
// `window.vizelTestEditor`. The scenarios reach it through this narrow shape
// rather than importing a framework type into the neutral scenario layer.
interface VizelTestEditor {
  commands: {
    setTextSelection: (range: { from: number; to: number }) => boolean;
    setContent: (content: string, options?: unknown) => boolean;
    clearContent: () => boolean;
    focus: () => boolean;
  };
  view: { focus: () => void };
  state: {
    doc: {
      content: { size: number };
      forEach: (visitor: (node: { type: { name: string } }, offset: number) => void) => void;
    };
  };
}

const isVizelTestEditor = (value: unknown): value is VizelTestEditor =>
  typeof value === "object" &&
  value !== null &&
  "commands" in value &&
  "view" in value &&
  "state" in value;

// Resolve the editor instance the fixture publishes on `window.vizelTestEditor`.
// The fixture assigns the instance inside its mount effect after Tiptap mounts,
// so poll rather than read once.
async function resolveTestEditor(): Promise<VizelTestEditor> {
  await expect
    .poll(() => isVizelTestEditor((window as { vizelTestEditor?: unknown }).vizelTestEditor), {
      timeout: 15_000,
    })
    .toBe(true);
  const candidate = (window as { vizelTestEditor?: unknown }).vizelTestEditor;
  if (!isVizelTestEditor(candidate)) {
    throw new Error("expected window.vizelTestEditor; mount a fixture that exposes the editor");
  }
  return candidate;
}

// Drive a TextSelection through Tiptap's command bus rather than synthetic
// chord keystrokes, which behave differently across browsers.
function applyEditorSelection(editor: VizelTestEditor, from: number, to: number): void {
  editor.view.focus();
  editor.commands.setTextSelection({ from, to });
}

// Dispatch a synthetic copy and return the lossless block payload the
// extension writes into the event's `DataTransfer`.
function dispatchCopy(el: HTMLElement): string {
  const data = new DataTransfer();
  const evt = new ClipboardEvent("copy", { clipboardData: data, bubbles: true, cancelable: true });
  el.dispatchEvent(evt);
  return data.getData("application/x-vizel-blocks");
}

// Dispatch a synthetic cut and return the lossless block payload.
function dispatchCut(el: HTMLElement): string {
  const data = new DataTransfer();
  const evt = new ClipboardEvent("cut", { clipboardData: data, bubbles: true, cancelable: true });
  el.dispatchEvent(evt);
  return data.getData("application/x-vizel-blocks");
}

// Dispatch a synthetic paste carrying a lossless block payload.
function dispatchPasteVizelBlocks(el: HTMLElement, payload: string): void {
  const data = new DataTransfer();
  data.setData("application/x-vizel-blocks", payload);
  const evt = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
  el.dispatchEvent(evt);
}

// Dispatch a synthetic paste carrying GFM-formatted Markdown.
function dispatchPasteMarkdown(el: HTMLElement, markdown: string): void {
  const data = new DataTransfer();
  data.setData("text/markdown", markdown);
  const evt = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
  el.dispatchEvent(evt);
}

// Load Markdown through the `tiptap-markdown` setContent override, which parses
// a raw string as Markdown automatically.
async function setMarkdownContent(editor: VizelTestEditor, markdown: string): Promise<void> {
  editor.commands.setContent(markdown);
  editor.commands.focus();
  // The setContent transaction commits asynchronously; allow the document to
  // settle before the scenario reads positions or sizes off it.
  await expect.poll(() => editor.state.doc.content.size, { timeout: 5_000 }).toBeGreaterThan(2);
}

/**
 * Verify copying a multi-block selection writes the lossless
 * `application/x-vizel-blocks` payload and that pasting it elsewhere reproduces
 * every block in order with content intact.
 */
export const testCopyMultiBlockPaste: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.click(editor);
  await userEvent.type(editor, "First paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Third paragraph");

  const testEditor = await resolveTestEditor();

  // Select the first two paragraphs only — the third stays as the paste
  // destination. "First paragraph" (15 chars) occupies positions 1..16,
  // "Second paragraph" (16 chars) occupies positions 18..34.
  applyEditorSelection(testEditor, 1, 34);

  const payload = dispatchCopy(el);
  expect(payload.length).toBeGreaterThan(0);
  const json = JSON.parse(payload);
  expect(json).toHaveProperty("content");

  // Move the cursor to the end of the third paragraph and paste.
  const docSize = testEditor.state.doc.content.size;
  applyEditorSelection(testEditor, docSize - 1, docSize - 1);
  dispatchPasteVizelBlocks(el, payload);

  // 3 originals + 2 pasted = 5 paragraphs.
  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(5);
  const paragraphs = el.querySelectorAll("p");
  expect(paragraphs[0]?.textContent).toContain("First paragraph");
  expect(paragraphs[1]?.textContent).toContain("Second paragraph");
  expect(paragraphs[2]?.textContent).toContain("Third paragraph");
  expect(paragraphs[3]?.textContent).toContain("First paragraph");
  expect(paragraphs[4]?.textContent).toContain("Second paragraph");
};

/**
 * Verify cutting a list block preserves list nesting when the payload is pasted
 * back into the document.
 */
export const testCutListItemPreservesNesting: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const testEditor = await resolveTestEditor();

  await setMarkdownContent(
    testEditor,
    ["- Top item", "  - Nested A", "  - Nested B", "", "Trailing paragraph", ""].join("\n")
  );

  // Find the start position of the first top-level paragraph (the trailing
  // paragraph) by walking the document.
  const matches: number[] = [];
  testEditor.state.doc.forEach((node, offset) => {
    if (node.type.name === "paragraph" && matches.length === 0) {
      matches.push(offset);
    }
  });
  const trailingPos = matches[0] ?? -1;
  if (trailingPos <= 0) throw new Error("Trailing paragraph not found");

  // Select the bullet list plus the start of the trailing paragraph so the
  // selection genuinely overlaps two top-level blocks; a selection that ends
  // exactly at the block boundary is attributed to the leading block only.
  applyEditorSelection(testEditor, 1, trailingPos + 2);

  const payload = dispatchCut(el);
  expect(payload.length).toBeGreaterThan(0);

  // After the cut, only the trailing paragraph remains. Move the cursor to the
  // end and paste the payload back.
  const afterCutSize = testEditor.state.doc.content.size;
  applyEditorSelection(testEditor, afterCutSize - 1, afterCutSize - 1);
  dispatchPasteVizelBlocks(el, payload);

  // Verify the bullet list nesting is preserved: a top-level ul with a nested
  // ul inside its first item carrying two list items.
  await expect.poll(() => el.querySelector("ul"), { timeout: 5_000 }).not.toBeNull();
  const topUl = el.querySelector("ul");
  if (topUl === null) throw new Error("expected a top-level ul");
  await expect.element(page.elementLocator(topUl)).toBeVisible();

  await expect.poll(() => topUl.querySelector("ul"), { timeout: 5_000 }).not.toBeNull();
  const nestedUl = topUl.querySelector("ul");
  if (nestedUl === null) throw new Error("expected a nested ul");
  await expect.element(page.elementLocator(nestedUl)).toBeVisible();
  await expect.poll(() => nestedUl.querySelectorAll("li").length, { timeout: 5_000 }).toBe(2);
};

/**
 * Verify pasting GFM-formatted Markdown is converted by the augmented
 * `editor.markdown.parse` pipeline and lands as native Tiptap nodes.
 */
export const testPasteMarkdownConverts: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.click(editor);
  await userEvent.type(editor, "Existing paragraph");

  // Move the cursor to the end of the document.
  const testEditor = await resolveTestEditor();
  const docSize = testEditor.state.doc.content.size;
  applyEditorSelection(testEditor, docSize - 1, docSize - 1);

  dispatchPasteMarkdown(el, "# Pasted heading\n\nPasted **bold** body.\n");

  await expect.poll(() => el.querySelectorAll("h1").length, { timeout: 5_000 }).toBe(1);
  expect(el.querySelector("h1")?.textContent).toContain("Pasted heading");

  await expect.poll(() => el.querySelectorAll("strong").length, { timeout: 5_000 }).toBe(1);
  expect(el.querySelector("strong")?.textContent).toContain("bold");
};
