import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared scenarios for the multi-block range selection extension
 * (Section 11b). The fixture exposes the active block range through a
 * `[data-testid="multi-block-state"]` element so the scenarios can
 * assert plugin state without driving the UI.
 *
 * The editor element is `.vizel-editor` — the contenteditable element
 * itself carries that class, not a wrapper.
 */

/**
 * Drive a `TextSelection` from `from` to `to` on the editor by reaching
 * through Tiptap's command bus. Playwright's `keyboard.press` for
 * `ControlOrMeta+Home` / `Shift+End` is browser-dependent (WebKit
 * collapses some chord combinations on macOS), so the scenarios drive
 * selection state through the editor command rather than synthetic
 * keystrokes. The fixture exposes the editor on
 * `window.vizelTestEditor` for this purpose.
 */
async function applyEditorSelection(page: Page, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ from: f, to: t }) => {
      const editor = (
        window as unknown as {
          vizelTestEditor?: {
            commands: { setTextSelection: (range: { from: number; to: number }) => boolean };
            view: { focus: () => void };
          };
        }
      ).vizelTestEditor;
      if (!editor) throw new Error("vizelTestEditor not exposed by fixture");
      editor.view.focus();
      editor.commands.setTextSelection({ from: f, to: t });
    },
    { from, to }
  );
}

/**
 * Resolve the document end position via the exposed editor instance.
 */
function readDocSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const editor = (
      window as unknown as {
        vizelTestEditor?: { state: { doc: { content: { size: number } } } };
      }
    ).vizelTestEditor;
    if (!editor) throw new Error("vizelTestEditor not exposed by fixture");
    return editor.state.doc.content.size;
  });
}

/**
 * Verify a text selection that spans two paragraphs activates the
 * multi-block range and decorates each block with
 * `data-vizel-block-selected`.
 */
export async function testShiftDownSelectsTwoBlocks(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const state = component.locator("[data-testid='multi-block-state']");

  await editor.click();
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");

  // Select the full document by setting the selection programmatically
  // — driving the same range through synthetic keystrokes is fragile
  // across browsers in Playwright.
  const docSize = await readDocSize(page);
  await applyEditorSelection(page, 1, docSize - 1);

  await expect(state).toContainText("blocks=2");

  const decorated = editor.locator("p[data-vizel-block-selected='true']");
  await expect(decorated).toHaveCount(2);
}

/**
 * Verify Backspace on an active multi-block range deletes every block
 * in a single transaction.
 */
export async function testBackspaceDeletesMultiBlockRange(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const state = component.locator("[data-testid='multi-block-state']");

  await editor.click();
  await page.keyboard.type("First paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Third paragraph");

  // Select the first two paragraphs only — the third must survive
  // Backspace. The first paragraph spans positions 1..16 ("First
  // paragraph" is 15 chars), the second 18..34 ("Second paragraph" is
  // 16 chars). Selecting (1, 34) hits both block bodies but stops
  // before the third paragraph.
  await applyEditorSelection(page, 1, 34);
  await expect(state).toContainText("blocks=2");

  await page.keyboard.press("Backspace");

  // Only the trailing paragraph remains.
  const paragraphs = editor.locator("p");
  await expect(paragraphs).toHaveCount(1);
  await expect(paragraphs.first()).toContainText("Third paragraph");
}
