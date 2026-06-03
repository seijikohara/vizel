import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared scenarios for the block-aware clipboard extension.
 * The fixture exposes the editor on
 * `window.vizelTestEditor` so the scenarios can drive selection state
 * through Tiptap's command bus — synthetic keystrokes for
 * `ControlOrMeta+Home` and similar chords behave differently across
 * browsers in Playwright.
 *
 * Clipboard interactions are driven through synthesized
 * `ClipboardEvent`s with `DataTransfer` payloads, because real
 * navigator-level clipboard access is gated by browser permissions
 * in CT mode.
 */

interface VizelTestEditor {
  commands: {
    setTextSelection: (range: { from: number; to: number }) => boolean;
    setContent: (content: string, options?: unknown) => boolean;
    clearContent: () => boolean;
    focus: () => boolean;
  };
  view: { focus: () => void };
  state: { doc: { content: { size: number } } };
}

declare global {
  interface Window {
    vizelTestEditor?: VizelTestEditor;
  }
}

async function applyEditorSelection(page: Page, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ from: f, to: t }) => {
      const editor = window.vizelTestEditor;
      if (!editor) throw new Error("vizelTestEditor not exposed by fixture");
      editor.view.focus();
      editor.commands.setTextSelection({ from: f, to: t });
    },
    { from, to }
  );
}

async function dispatchCopy(editor: Locator): Promise<string> {
  return await editor.evaluate((el): string => {
    const data = new DataTransfer();
    const evt = new ClipboardEvent("copy", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(evt);
    return data.getData("application/x-vizel-blocks");
  });
}

async function dispatchCut(editor: Locator): Promise<string> {
  return await editor.evaluate((el): string => {
    const data = new DataTransfer();
    const evt = new ClipboardEvent("cut", { clipboardData: data, bubbles: true, cancelable: true });
    el.dispatchEvent(evt);
    return data.getData("application/x-vizel-blocks");
  });
}

async function dispatchPasteVizelBlocks(editor: Locator, payload: string): Promise<void> {
  await editor.evaluate((el, json: string) => {
    const data = new DataTransfer();
    data.setData("application/x-vizel-blocks", json);
    const evt = new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(evt);
  }, payload);
}

async function dispatchPasteMarkdown(editor: Locator, markdown: string): Promise<void> {
  await editor.evaluate((el, md: string) => {
    const data = new DataTransfer();
    data.setData("text/markdown", md);
    const evt = new ClipboardEvent("paste", {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(evt);
  }, markdown);
}

function readDocSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const editor = window.vizelTestEditor;
    if (!editor) throw new Error("vizelTestEditor not exposed by fixture");
    return editor.state.doc.content.size;
  });
}

async function waitForEditor(page: Page): Promise<void> {
  await page.waitForFunction(() => window.vizelTestEditor !== undefined);
}

async function setMarkdownContent(page: Page, markdown: string): Promise<void> {
  await waitForEditor(page);
  await page.evaluate((md: string) => {
    const editor = window.vizelTestEditor;
    if (!editor) throw new Error("vizelTestEditor not exposed by fixture");
    // `tiptap-markdown` overrides setContent so a raw string is
    // parsed as Markdown automatically.
    editor.commands.setContent(md);
    editor.commands.focus();
  }, markdown);
}

/**
 * Verify that copying a multi-block selection writes the
 * lossless `application/x-vizel-blocks` payload and that pasting it
 * elsewhere reproduces every block in order with content intact.
 */
export async function testCopyMultiBlockPaste(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");

  await editor.click();
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Third paragraph");

  // Select the first two paragraphs only — the third stays as the
  // paste destination. Positions match the multi-block-selection
  // scenarios: "First paragraph" (15 chars) occupies positions 1..16,
  // "Second paragraph" (16 chars) occupies positions 18..34.
  await applyEditorSelection(page, 1, 34);

  const payload = await dispatchCopy(editor);
  expect(payload.length).toBeGreaterThan(0);
  const json = JSON.parse(payload);
  expect(json).toHaveProperty("content");

  // Move the cursor to the end of the third paragraph and paste.
  const docSize = await readDocSize(page);
  await applyEditorSelection(page, docSize - 1, docSize - 1);
  await dispatchPasteVizelBlocks(editor, payload);

  const paragraphs = editor.locator("p");
  // 3 originals + 2 pasted = 5 paragraphs.
  await expect(paragraphs).toHaveCount(5);
  await expect(paragraphs.nth(0)).toContainText("First paragraph");
  await expect(paragraphs.nth(1)).toContainText("Second paragraph");
  await expect(paragraphs.nth(2)).toContainText("Third paragraph");
  await expect(paragraphs.nth(3)).toContainText("First paragraph");
  await expect(paragraphs.nth(4)).toContainText("Second paragraph");
}

/**
 * Verify that cutting a list block preserves list nesting when the
 * payload is pasted back into the document.
 */
export async function testCutListItemPreservesNesting(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");

  await setMarkdownContent(
    page,
    ["- Top item", "  - Nested A", "  - Nested B", "", "Trailing paragraph", ""].join("\n")
  );

  // Select from the top of the document up to (but not including) the
  // trailing paragraph. The trailing paragraph's start position is
  // discovered by walking the doc for a top-level paragraph node.
  const trailingPos = await page.evaluate(() => {
    const editor = window.vizelTestEditor as unknown as {
      state: {
        doc: {
          forEach: (visitor: (node: { type: { name: string } }, offset: number) => void) => void;
        };
      };
    };
    const matches: number[] = [];
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === "paragraph" && matches.length === 0) {
        matches.push(offset);
      }
    });
    return matches[0] ?? -1;
  });
  if (trailingPos <= 0) throw new Error("Trailing paragraph not found");

  // Select the bullet list plus the start of the trailing paragraph so
  // the selection genuinely overlaps two top-level blocks (a selection
  // that ends exactly at the boundary between blocks is attributed to
  // the leading block only by `computeMultiBlockSelectionState`).
  await applyEditorSelection(page, 1, trailingPos + 2);

  const payload = await dispatchCut(editor);
  expect(payload.length).toBeGreaterThan(0);

  // After the cut, only the trailing paragraph remains. Move the
  // cursor to the end and paste the payload back.
  const afterCutSize = await readDocSize(page);
  await applyEditorSelection(page, afterCutSize - 1, afterCutSize - 1);
  await dispatchPasteVizelBlocks(editor, payload);

  // Verify the bullet list nesting is preserved: a top-level ul with
  // a nested ul inside its first item carrying two list items.
  const topUl = editor.locator("ul").first();
  await expect(topUl).toBeVisible();
  const nestedUl = topUl.locator("ul").first();
  await expect(nestedUl).toBeVisible();
  await expect(nestedUl.locator("li")).toHaveCount(2);
}

/**
 * Verify that pasting GFM-formatted Markdown is converted by the
 * augmented `editor.markdown.parse` pipeline and lands as native
 * Tiptap nodes.
 */
export async function testPasteMarkdownConverts(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");

  await editor.click();
  await page.keyboard.type("Existing paragraph");

  // Move cursor to the end of the document.
  const docSize = await readDocSize(page);
  await applyEditorSelection(page, docSize - 1, docSize - 1);

  await dispatchPasteMarkdown(editor, "# Pasted heading\n\nPasted **bold** body.\n");

  const heading = editor.locator("h1");
  await expect(heading).toHaveCount(1);
  await expect(heading).toContainText("Pasted heading");

  const bold = editor.locator("strong");
  await expect(bold).toHaveCount(1);
  await expect(bold).toContainText("bold");
}
