import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

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

// Verify the editor mounts and is editable.
export const testEditorRenders: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();
  expect(el.getAttribute("contenteditable")).toBe("true");
};

// Verify the editor accepts typed text. The interaction proves the userEvent
// API works identically across React, Vue, and Svelte fixtures. `userEvent.type`
// dispatches the same key sequence ProseMirror's contenteditable handler expects.
export const testEditorTyping: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Hello, Vizel!");
  await expect.element(editor).toHaveTextContent("Hello, Vizel!");
};
