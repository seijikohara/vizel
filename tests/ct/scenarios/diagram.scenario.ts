import { expect } from "vitest";

import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for Diagram support
 * (Mermaid and GraphViz). Each scenario inserts a diagram through the slash
 * menu, then drives the node-view textarea directly.
 */

const DIAGRAM = ".vizel-diagram";
const SLASH_MENU = "[data-vizel-slash-menu]";
const EDITOR = ".vizel-editor";

// Resolve the editor contenteditable root. Tiptap mounts asynchronously, so
// poll until the element appears rather than querying once.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and the asynchronous Tiptap mount can exceed the
  // default 1s poll budget under that contention.
  await expect.poll(() => document.querySelector(EDITOR), { timeout: 15_000 }).not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Click the editor to focus it, then dismiss any bubble menu the click raised.
async function clickEditorStart(): Promise<HTMLElement> {
  const el = await resolveEditor();
  await userEvent.click(page.elementLocator(el));
  await userEvent.keyboard("{Escape}");
  return el;
}

// Resolve the inserted diagram node. The diagram renders inside the editor, so
// it appears asynchronously after the slash-menu selection commits.
async function resolveDiagram(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector(DIAGRAM), { timeout: 5_000 }).not.toBeNull();
  const diagram = document.querySelector<HTMLElement>(DIAGRAM);
  if (diagram === null) throw new Error("expected a .vizel-diagram element");
  return diagram;
}

// Insert a diagram by typing the given slash command and pressing Enter.
async function insertDiagram(slashQuery: string): Promise<HTMLElement> {
  await clickEditorStart();
  await userEvent.keyboard(slashQuery);
  await expect.poll(() => document.querySelector(SLASH_MENU), { timeout: 5_000 }).not.toBeNull();
  await userEvent.keyboard("{Enter}");
  return resolveDiagram();
}

// Open the diagram editor and resolve its textarea. The textarea is a native
// element inside the node view, so it accepts a direct value assignment plus an
// "input" event to drive the live preview, mirroring the Playwright original.
async function openDiagramEditor(diagram: HTMLElement): Promise<HTMLTextAreaElement> {
  const renderContainer = diagram.querySelector<HTMLElement>(".vizel-diagram-render");
  if (renderContainer === null) throw new Error("expected a .vizel-diagram-render element");
  await userEvent.click(page.elementLocator(renderContainer));

  await expect.poll(() => diagram.querySelector("textarea"), { timeout: 5_000 }).not.toBeNull();
  const textarea = diagram.querySelector<HTMLTextAreaElement>("textarea");
  if (textarea === null) throw new Error("expected a diagram textarea");
  await expect.element(page.elementLocator(textarea)).toBeVisible();
  return textarea;
}

// Replace the textarea content. ProseMirror node views read the textarea value
// from the synthetic "input" event, so set the value then dispatch it directly
// rather than typing character by character.
function setTextareaValue(textarea: HTMLTextAreaElement, code: string): void {
  textarea.focus();
  textarea.value = code;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Verify a diagram can be inserted via slash command. */
export const testDiagramInsert: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  await expect.element(page.elementLocator(diagram)).toBeVisible();

  const typeIndicator = diagram.querySelector<HTMLElement>(".vizel-diagram-type");
  if (typeIndicator === null) throw new Error("expected a .vizel-diagram-type element");
  await expect.element(page.elementLocator(typeIndicator)).toHaveTextContent("Mermaid");
};

/** Verify a diagram shows the default flowchart when inserted. */
export const testDiagramDefaultContent: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

/** Verify a diagram can be edited by clicking. */
export const testDiagramClickToEdit: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);
  await expect.element(page.elementLocator(textarea)).toBeVisible();
};

/** Verify Mermaid code can be typed and rendered. */
export const testDiagramTyping: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(
    textarea,
    `flowchart LR
    A[Start] --> B[Process]
    B --> C[End]`
  );

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview svg"), { timeout: 10_000 })
    .not.toBeNull();

  textarea.blur();
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

/** Verify a diagram shows an error for invalid syntax. */
export const testDiagramErrorHandling: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(textarea, "invalid mermaid syntax {{{{");

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview .vizel-diagram-error-display"), {
      timeout: 10_000,
    })
    .not.toBeNull();
};

/** Verify a diagram can be selected. */
export const testDiagramSelection: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  await expect.element(page.elementLocator(diagram)).toBeVisible();

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();

  await userEvent.click(page.elementLocator(diagram));
  await expect.element(page.elementLocator(diagram)).toHaveClass(/vizel-diagram-selected/);
};

/** Verify a diagram can render a sequence diagram. */
export const testDiagramSequence: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(
    textarea,
    `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice`
  );

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview svg"), { timeout: 10_000 })
    .not.toBeNull();

  textarea.blur();
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

/** Verify the Escape key cancels edit mode and restores the original code. */
export const testDiagramEscapeToCancel: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);

  const originalCode = textarea.value;

  setTextareaValue(textarea, "changed content");

  await userEvent.keyboard("{Escape}");
  await expect.element(page.elementLocator(textarea)).not.toBeVisible();

  // Re-open the editor and confirm the cancelled edit did not persist.
  const reopened = await openDiagramEditor(diagram);
  expect(reopened.value).toBe(originalCode);
};

/** Verify Ctrl/Cmd + Enter saves the diagram. */
export const testDiagramCtrlEnterToSave: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/mermaid");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(
    textarea,
    `flowchart TD
    A[New] --> B[Diagram]`
  );

  await pressKeyChord("Mod", "Enter");
  await expect.element(page.elementLocator(textarea)).not.toBeVisible();

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

// ============================================
// GraphViz Tests
// ============================================

/** Verify a GraphViz diagram can be inserted via slash command. */
export const testGraphVizDiagramInsert: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/graphviz");
  await expect.element(page.elementLocator(diagram)).toBeVisible();

  const typeIndicator = diagram.querySelector<HTMLElement>(".vizel-diagram-type");
  if (typeIndicator === null) throw new Error("expected a .vizel-diagram-type element");
  await expect.element(page.elementLocator(typeIndicator)).toHaveTextContent("GraphViz");
};

/** Verify a GraphViz diagram shows default content when inserted. */
export const testGraphVizDiagramDefaultContent: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/graphviz");
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

/** Verify GraphViz DOT code can be typed and rendered. */
export const testGraphVizDiagramTyping: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/graphviz");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(
    textarea,
    `digraph G {
    A -> B -> C
    B -> D
  }`
  );

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview svg"), { timeout: 10_000 })
    .not.toBeNull();

  textarea.blur();
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};

/** Verify a GraphViz diagram shows an error for invalid syntax. */
export const testGraphVizDiagramErrorHandling: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/graphviz");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(textarea, "digraph { invalid syntax {{{{");

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview .vizel-diagram-error-display"), {
      timeout: 10_000,
    })
    .not.toBeNull();
};

/** Verify GraphViz can render different graph layouts. */
export const testGraphVizDiagramLayout: VizelBcScenario = async () => {
  const diagram = await insertDiagram("/graphviz");
  const textarea = await openDiagramEditor(diagram);

  setTextareaValue(
    textarea,
    `digraph G {
    rankdir=LR
    node [shape=box]
    A [label="Start"]
    B [label="Process"]
    C [label="End"]
    A -> B -> C
  }`
  );

  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-preview svg"), { timeout: 10_000 })
    .not.toBeNull();

  textarea.blur();
  await expect
    .poll(() => diagram.querySelector(".vizel-diagram-render svg"), { timeout: 10_000 })
    .not.toBeNull();
};
