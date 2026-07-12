import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears. `.vizel-editor` is a div, not an ARIA
// textbox, so the query uses a class selector.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the concurrent three-browser matrix saturates the
  // machine and the asynchronous Tiptap mount can exceed the default 1 s budget.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Minimal view of the editor instance the fixture publishes on
// `window.vizelTestEditor`. The scenarios reach it through this narrow shape
// rather than importing a framework type into the neutral scenario layer.
interface VizelTestEditor {
  commands: {
    setTextSelection: (range: { from: number; to: number }) => boolean;
  };
  view: { focus: () => void };
  state: { doc: { content: { size: number } } };
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

// Resolve the [data-testid="multi-block-state"] element the fixture renders.
async function resolveStateEl(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("[data-testid='multi-block-state']"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("[data-testid='multi-block-state']");
  if (el === null) throw new Error("expected [data-testid='multi-block-state']");
  return el;
}

// Drive a TextSelection from `from` to `to` through Tiptap's command bus.
// Synthetic keystrokes for chord combinations (ControlOrMeta+Home, Shift+End)
// behave differently across browsers, so the selection is applied via the
// editor command instead of key events. This matches the Playwright original.
function applyEditorSelection(editor: VizelTestEditor, from: number, to: number): void {
  editor.view.focus();
  editor.commands.setTextSelection({ from, to });
}

/**
 * Verify a text selection spanning two paragraphs activates the multi-block
 * range and decorates each block with `data-vizel-block-selected`.
 */
export const testShiftDownSelectsTwoBlocks: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  const stateEl = await resolveStateEl();

  await userEvent.click(editor);
  await userEvent.type(editor, "First paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second paragraph");

  // Select the full document programmatically — driving the same range through
  // synthetic keystrokes is fragile across browsers.
  const testEditor = await resolveTestEditor();
  const docSize = testEditor.state.doc.content.size;
  applyEditorSelection(testEditor, 1, docSize - 1);

  await expect.poll(() => stateEl.textContent, { timeout: 5_000 }).toContain("blocks=2");

  // Each paragraph in the selection receives the decoration attribute.
  await expect
    .poll(() => el.querySelectorAll("p[data-vizel-block-selected='true']").length, {
      timeout: 5_000,
    })
    .toBe(2);
};

/**
 * Verify Backspace on an active multi-block range deletes every block in a
 * single transaction, leaving the third paragraph intact.
 */
export const testBackspaceDeletesMultiBlockRange: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  const stateEl = await resolveStateEl();

  await userEvent.click(editor);
  await userEvent.type(editor, "First paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second paragraph");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Third paragraph");

  // Select the first two paragraphs only — the third must survive Backspace.
  // The first paragraph spans positions 1..16 ("First paragraph" is 15 chars),
  // the second 18..34 ("Second paragraph" is 16 chars). Selecting (1, 34) covers
  // both block bodies but stops before the third paragraph.
  const testEditor = await resolveTestEditor();
  applyEditorSelection(testEditor, 1, 34);
  await expect.poll(() => stateEl.textContent, { timeout: 5_000 }).toContain("blocks=2");

  await userEvent.keyboard("{Backspace}");

  // Only the trailing paragraph remains after the multi-block delete.
  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(1);
  await expect
    .poll(() => el.querySelector("p")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Third paragraph");
};
