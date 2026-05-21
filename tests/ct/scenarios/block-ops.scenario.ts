/**
 * Block operation command scenarios.
 *
 * Exercise the `vizelBlockOperationCommands` registry from Section
 * 11a — duplicate / move-up / move-down — through the editor's
 * command bus (the fixtures expose the editor on
 * `window.vizelTestEditor`). The synthetic keystroke path for
 * `Alt+ArrowUp` / `Alt+ArrowDown` / `Mod+D` chords is unreliable
 * across browsers, so the scenarios drive each command by id through
 * the registry's `run(editor)` callback.
 */
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

interface BlockOpCommand {
  readonly id: string;
  readonly run: (editor: unknown) => void;
}

interface TestWindow extends Window {
  vizelTestEditor?: unknown;
  vizelBlockOperationCommands?: readonly BlockOpCommand[];
}

async function runBlockOpCommand(page: Page, id: string): Promise<void> {
  await page.evaluate((commandId: string) => {
    const win = window as TestWindow;
    const editor = win.vizelTestEditor;
    const registry = win.vizelBlockOperationCommands;
    if (!editor) throw new Error("vizelTestEditor not exposed on window");
    if (!registry) throw new Error("vizelBlockOperationCommands not exposed on window");
    const command = registry.find((c) => c.id === commandId);
    if (!command) throw new Error(`Unknown command id: ${commandId}`);
    command.run(editor);
  }, id);
}

async function setSelection(page: Page, from: number, to: number = from): Promise<void> {
  await page.evaluate(
    ([f, t]: readonly [number, number]) => {
      const editor = (window as TestWindow).vizelTestEditor as
        | { commands: { setTextSelection: (range: number | { from: number; to: number }) => void } }
        | undefined;
      if (!editor) throw new Error("vizelTestEditor not exposed on window");
      editor.commands.setTextSelection(f === t ? f : { from: f, to: t });
    },
    [from, to]
  );
}

export async function testBlockOpDuplicatesCurrentBlock(
  component: Locator,
  page: Page
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Alpha");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Beta");

  // Move the selection inside the "Alpha" paragraph then duplicate.
  await setSelection(page, 3);
  await runBlockOpCommand(page, "block/duplicate");

  const paragraphs = editor.locator("p");
  await expect(paragraphs).toHaveCount(3);
  await expect(paragraphs.nth(0)).toContainText("Alpha");
  await expect(paragraphs.nth(1)).toContainText("Alpha");
  await expect(paragraphs.nth(2)).toContainText("Beta");
}

export async function testBlockOpMovesBlockUp(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("First");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second");

  // Land inside "Second" then move-up swaps with "First".
  await setSelection(page, 10);
  await runBlockOpCommand(page, "block/move-up");

  const paragraphs = editor.locator("p");
  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.nth(0)).toContainText("Second");
  await expect(paragraphs.nth(1)).toContainText("First");
}

export async function testBlockOpMovesBlockDown(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("First");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second");

  // Land inside "First" then move-down swaps with "Second".
  await setSelection(page, 3);
  await runBlockOpCommand(page, "block/move-down");

  const paragraphs = editor.locator("p");
  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.nth(0)).toContainText("Second");
  await expect(paragraphs.nth(1)).toContainText("First");
}
