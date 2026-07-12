/**
 * Block operation command scenarios (Vitest Browser port).
 *
 * Exercise the `vizelBlockOperationCommands` registry — duplicate /
 * move-up / move-down — through the editor's command bus. The fixtures
 * expose the editor on `window.vizelTestEditor` and the command
 * registry on `window.vizelBlockOperationCommands`.
 *
 * The Playwright originals drove commands through `page.evaluate`
 * because keyboard chords for Alt+ArrowUp / Alt+ArrowDown / Mod+D are
 * unreliable across browsers. Running in the browser, this port reaches
 * the window globals directly without evaluate and polls until the async
 * Tiptap mount assigns them.
 */
import { expect } from "vitest";

import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

interface BlockOpCommand {
  readonly id: string;
  readonly run: (editor: unknown) => void;
}

interface TestWindow extends Window {
  vizelTestEditor?: unknown;
  vizelBlockOperationCommands?: readonly BlockOpCommand[];
}

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously,
// so poll until the element appears. Allow 15 s: the full nine-instance matrix
// saturates the machine and can push the async mount beyond the default 1 s budget.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve the editor instance from `window.vizelTestEditor`. The fixture
// assigns the instance inside its mount effect after Tiptap's async mount,
// so poll rather than read once.
async function resolveTestWindow(): Promise<{
  editor: unknown;
  registry: readonly BlockOpCommand[];
}> {
  const win = window as unknown as TestWindow;

  // Both globals are set together in the fixture's mount effect, so polling
  // for the registry also implies the editor is ready.
  await expect
    .poll(() => Array.isArray(win.vizelBlockOperationCommands), { timeout: 15_000 })
    .toBe(true);

  const editor = win.vizelTestEditor;
  const registry = win.vizelBlockOperationCommands;
  if (editor === undefined) throw new Error("window.vizelTestEditor not set by fixture");
  if (!Array.isArray(registry))
    throw new Error("window.vizelBlockOperationCommands not set by fixture");
  return { editor, registry };
}

// Run a named command from the block-operation registry. The Playwright
// original used `page.evaluate` to cross the process boundary; running
// in-browser, the globals are accessible directly.
async function runBlockOpCommand(id: string): Promise<void> {
  const { editor, registry } = await resolveTestWindow();
  const command = registry.find((c) => c.id === id);
  if (command === undefined) throw new Error(`Unknown command id: ${id}`);
  command.run(editor);
}

// Programmatically set the ProseMirror selection. The Playwright original
// used `page.evaluate` to call `editor.commands.setTextSelection`; running
// in-browser, the method is reachable through the same window global.
async function setSelection(from: number, to: number = from): Promise<void> {
  const { editor } = await resolveTestWindow();
  const typedEditor = editor as {
    commands: {
      setTextSelection: (range: number | { from: number; to: number }) => void;
    };
  };
  typedEditor.commands.setTextSelection(from === to ? from : { from, to });
}

/**
 * Verify `block/duplicate` inserts a copy of the current block below the
 * original. After typing two paragraphs and duplicating the first, the
 * document must contain three paragraphs with the original text order
 * Alpha / Alpha / Beta.
 */
export const testBlockOpDuplicatesCurrentBlock: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Alpha");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Beta");

  // Position inside "Alpha" (offset 3) then duplicate the block.
  await setSelection(3);
  await runBlockOpCommand("block/duplicate");

  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(3);
  await expect
    .poll(() => el.querySelectorAll("p")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Alpha");
  await expect
    .poll(() => el.querySelectorAll("p")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Alpha");
  await expect
    .poll(() => el.querySelectorAll("p")[2]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Beta");
};

/**
 * Verify `block/move-up` swaps the current block with the preceding sibling.
 * After typing "First" and "Second", selecting inside "Second" and running
 * move-up must reorder the paragraphs to Second / First.
 */
export const testBlockOpMovesBlockUp: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "First");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second");

  // Position inside "Second" (offset 10) then move-up swaps with "First".
  await setSelection(10);
  await runBlockOpCommand("block/move-up");

  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(2);
  await expect
    .poll(() => el.querySelectorAll("p")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Second");
  await expect
    .poll(() => el.querySelectorAll("p")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("First");
};

/**
 * Verify `block/move-down` swaps the current block with the following sibling.
 * After typing "First" and "Second", selecting inside "First" and running
 * move-down must reorder the paragraphs to Second / First.
 */
export const testBlockOpMovesBlockDown: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "First");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second");

  // Position inside "First" (offset 3) then move-down swaps with "Second".
  await setSelection(3);
  await runBlockOpCommand("block/move-down");

  await expect.poll(() => el.querySelectorAll("p").length, { timeout: 5_000 }).toBe(2);
  await expect
    .poll(() => el.querySelectorAll("p")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Second");
  await expect
    .poll(() => el.querySelectorAll("p")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("First");
};
