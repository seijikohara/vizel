import { expect } from "vitest";
import { page, type VizelBcScenario } from "./_vitest-context";

// Verify the editor mounts and is editable. `.vizel-editor` is the ProseMirror
// contenteditable root (a div, not an ARIA textbox), so it is queried by class.
// Tiptap initializes asynchronously after render, so poll until it appears.
export const testEditorRenders: VizelBcScenario = async () => {
  await expect.poll(() => document.querySelector(".vizel-editor")).not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  await expect.element(page.elementLocator(el)).toBeVisible();
  expect(el.getAttribute("contenteditable")).toBe("true");
};
