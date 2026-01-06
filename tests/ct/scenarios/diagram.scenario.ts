import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for Diagram (Mermaid) support.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

const DIAGRAM_SELECTOR = ".vizel-diagram";

/** Helper to click editor to focus it */
async function clickEditorStart(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  // Click at the center of the editor to avoid overlap with drag handle
  await editor.click();
  // Dismiss any bubble menu
  await page.keyboard.press("Escape");
}

/** Helper to insert a diagram via slash command */
async function insertDiagram(component: Locator, page: Page): Promise<void> {
  await clickEditorStart(component, page);
  await page.keyboard.type("/mermaid");
  // Wait for slash menu to appear
  await expect(page.locator(".vizel-slash-menu")).toBeVisible();
  await page.keyboard.press("Enter");
  // Wait for diagram to be inserted
  await expect(component.locator(DIAGRAM_SELECTOR)).toBeVisible();
}

/** Verify diagram can be inserted via slash command */
export async function testDiagramInsert(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  await expect(diagram).toBeVisible();

  // Should have type indicator
  const typeIndicator = diagram.locator(".vizel-diagram-type");
  await expect(typeIndicator).toContainText("Mermaid");
}

/** Verify diagram shows default flowchart when inserted */
export async function testDiagramDefaultContent(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  await expect(diagram).toBeVisible();

  // Wait for Mermaid to render (SVG should appear)
  const svg = diagram.locator(".vizel-diagram-render svg");
  await expect(svg).toBeVisible({ timeout: 10000 });
}

/** Verify diagram can be edited by clicking */
export async function testDiagramClickToEdit(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  // Click the render container to start editing
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  // Should show edit mode with textarea
  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();
}

/** Verify Mermaid code can be typed in diagram */
export async function testDiagramTyping(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  // Click the render container to start editing
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();

  // Clear and type new Mermaid code
  const mermaidCode = `flowchart LR
    A[Start] --> B[Process]
    B --> C[End]`;

  await textarea.evaluate((el: HTMLTextAreaElement, code: string) => {
    el.focus();
    el.value = code;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, mermaidCode);

  // Wait for live preview to render
  const preview = diagram.locator(".vizel-diagram-preview svg");
  await expect(preview).toBeVisible({ timeout: 10000 });

  // Blur the textarea to save content
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.blur();
  });

  // Verify the diagram is rendered in main view
  const svg = diagram.locator(".vizel-diagram-render svg");
  await expect(svg).toBeVisible({ timeout: 10000 });
}

/** Verify diagram shows error for invalid syntax */
export async function testDiagramErrorHandling(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  // Click the render container to start editing
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();

  // Type invalid Mermaid code
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.focus();
    el.value = "invalid mermaid syntax {{{{";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Wait for error to appear in preview
  const errorDisplay = diagram.locator(
    ".vizel-diagram-preview .vizel-diagram-error-display, .vizel-diagram-preview:has-text('Error')"
  );
  await expect(errorDisplay).toBeVisible({ timeout: 10000 });
}

/** Verify diagram can be selected */
export async function testDiagramSelection(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  await expect(diagram).toBeVisible();

  // Wait for SVG to render
  const svg = diagram.locator(".vizel-diagram-render svg");
  await expect(svg).toBeVisible({ timeout: 10000 });

  // Click on the diagram to select it
  await diagram.click();

  // Should have selected class
  await expect(diagram).toHaveClass(/vizel-diagram-selected/);
}

/** Verify diagram can render sequence diagram */
export async function testDiagramSequence(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();

  // Type sequence diagram code
  const sequenceCode = `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice`;

  await textarea.evaluate((el: HTMLTextAreaElement, code: string) => {
    el.focus();
    el.value = code;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, sequenceCode);

  // Wait for preview to render
  const preview = diagram.locator(".vizel-diagram-preview svg");
  await expect(preview).toBeVisible({ timeout: 10000 });

  // Blur to save
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.blur();
  });

  // Verify the diagram is rendered
  const svg = diagram.locator(".vizel-diagram-render svg");
  await expect(svg).toBeVisible({ timeout: 10000 });
}

/** Verify escape key cancels edit mode */
export async function testDiagramEscapeToCancel(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();

  // Remember original code
  const originalCode = await textarea.inputValue();

  // Type some changes
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.focus();
    el.value = "changed content";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Press Escape to cancel
  await page.keyboard.press("Escape");

  // Textarea should be hidden
  await expect(textarea).not.toBeVisible();

  // Click to edit again and verify original code is restored
  await renderContainer.click();
  await expect(textarea).toBeVisible();

  const restoredCode = await textarea.inputValue();
  expect(restoredCode).toBe(originalCode);
}

/** Verify Ctrl/Cmd + Enter saves diagram */
export async function testDiagramCtrlEnterToSave(component: Locator, page: Page): Promise<void> {
  await insertDiagram(component, page);

  const diagram = component.locator(DIAGRAM_SELECTOR);
  const renderContainer = diagram.locator(".vizel-diagram-render");
  await renderContainer.click();

  const textarea = diagram.locator("textarea");
  await expect(textarea).toBeVisible();

  // Type new code
  const newCode = `flowchart TD
    A[New] --> B[Diagram]`;

  await textarea.evaluate((el: HTMLTextAreaElement, code: string) => {
    el.focus();
    el.value = code;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, newCode);

  // Use Ctrl/Cmd + Enter to save
  await page.keyboard.press("ControlOrMeta+Enter");

  // Textarea should be hidden
  await expect(textarea).not.toBeVisible();

  // SVG should be rendered in main view
  const svg = diagram.locator(".vizel-diagram-render svg");
  await expect(svg).toBeVisible({ timeout: 10000 });
}
