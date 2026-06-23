import { expect } from "vitest";
import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the .vizel-editor root. Tiptap mounts asynchronously after the
// framework renders, so poll until the element appears to avoid a race with
// the async mount.
async function resolveEditor(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Resolve a button by data-testid, polling until it appears. The fixture
// renders buttons at mount time so the poll budget is short.
async function resolveButton(testId: string): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector(`[data-testid="${testId}"]`), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`expected [data-testid="${testId}"]`);
  return el;
}

// Resolve the markdown output element and poll until its text content is non-empty.
// The export handler sets the output synchronously after a button click, so the
// render cycle is the only latency — a short budget is sufficient.
async function resolveMarkdownOutput(): Promise<HTMLElement> {
  await expect
    .poll(() => document.querySelector("[data-testid='markdown-output']"), { timeout: 5_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (el === null) throw new Error("expected [data-testid='markdown-output']");
  return el;
}

/**
 * Verify the Markdown extension exports bold text as `**Word**` syntax.
 *
 * Types text, toggles bold via the keyboard shortcut, then clicks the export
 * button and checks that the output element contains the GFM bold marker.
 */
export const testMarkdownExport: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.click(editor);
  await userEvent.type(editor, "Hello ");
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard("World");
  await pressKeyChord("Mod", "b");

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = await resolveMarkdownOutput();
  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain("**World**");
};

/**
 * Verify the Markdown extension imports markdown with bold and renders a `<strong>`.
 *
 * Clicking the import button calls `setContent` with a markdown string;
 * the editor parses the bold marker and creates a `<strong>` node.
 */
export const testMarkdownImport: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("strong"), { timeout: 5_000 }).not.toBeNull();
  const bold = el.querySelector<HTMLElement>("strong");
  if (bold === null) throw new Error("expected a <strong> element");
  expect(bold.textContent).toContain("bold");
};

/**
 * Verify the Markdown extension exports a heading as `# My Heading`.
 *
 * Types the heading text, selects all, applies H1 via the keyboard shortcut,
 * then exports and checks the output.
 */
export const testMarkdownHeading: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.type(editor, "My Heading");
  await pressKeyChord("Mod", "a");
  await pressKeyChord("Mod", "Alt", "1");

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = await resolveMarkdownOutput();
  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain("# My Heading");
};

/**
 * Verify the Markdown extension exports a bullet list as `- Item` syntax.
 *
 * Types two list items using the `- ` input rule and checks that both appear
 * in the exported markdown.
 */
export const testMarkdownList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.type(editor, "- Item 1");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Item 2");

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = await resolveMarkdownOutput();
  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain("- Item 1");
  expect(output.textContent).toContain("- Item 2");
};

/**
 * Verify the Markdown extension imports a fenced code block and renders `<pre>`.
 *
 * The import button calls `setContent` with a markdown code fence; the editor
 * parses the fence and creates a `<pre>` node containing the code text.
 */
export const testMarkdownCodeBlock: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-code-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("pre"), { timeout: 5_000 }).not.toBeNull();
  const codeBlock = el.querySelector<HTMLElement>("pre");
  if (codeBlock === null) throw new Error("expected a <pre> element");
  await expect.element(page.elementLocator(codeBlock)).toBeVisible();
  expect(codeBlock.textContent).toContain("const x = 1");
};

/**
 * Verify the Markdown extension imports an inline link and renders `<a href>`.
 *
 * The import button calls `setContent` with a markdown link; the editor parses
 * the link and creates an `<a>` element with the expected `href`.
 */
export const testMarkdownLink: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-link-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("a"), { timeout: 5_000 }).not.toBeNull();
  const link = el.querySelector<HTMLElement>("a");
  if (link === null) throw new Error("expected an <a> element");
  await expect.element(page.elementLocator(link)).toBeVisible();
  expect(link.getAttribute("href")).toBe("https://example.com");
};

/**
 * Verify the Markdown extension exports italic text as `*italic*` syntax.
 *
 * Types text, toggles italic via the keyboard shortcut, then exports and
 * checks the output for the markdown italic marker.
 */
export const testMarkdownItalic: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  await userEvent.click(editor);
  await userEvent.type(editor, "Hello ");
  await pressKeyChord("Mod", "i");
  await userEvent.keyboard("italic");
  await pressKeyChord("Mod", "i");
  await userEvent.keyboard(" world");

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = await resolveMarkdownOutput();
  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain("*italic*");
};

/**
 * Verify the Markdown extension imports strikethrough markdown and renders `<s>`.
 *
 * The import button calls `setContent` with `~~deleted~~` syntax; the editor
 * parses the tilde markers and creates an `<s>` element.
 */
export const testMarkdownStrikethrough: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-strikethrough-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("s"), { timeout: 5_000 }).not.toBeNull();
  const strike = el.querySelector<HTMLElement>("s");
  if (strike === null) throw new Error("expected an <s> element");
  await expect.element(page.elementLocator(strike)).toBeVisible();
  expect(strike.textContent).toContain("deleted");
};

/**
 * Verify the Markdown extension imports an inline code span and renders `<code>`.
 *
 * The import button calls `setContent` with backtick syntax; the editor parses
 * the backtick and creates a `<code>` element.
 */
export const testMarkdownInlineCode: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-inline-code-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("code"), { timeout: 5_000 }).not.toBeNull();
  const code = el.querySelector<HTMLElement>("code");
  if (code === null) throw new Error("expected a <code> element");
  await expect.element(page.elementLocator(code)).toBeVisible();
  expect(code.textContent).toContain("variable");
};

/**
 * Verify the Markdown extension imports an image and renders `<img>` with src and alt.
 *
 * The import button calls `setContent` with `![alt](url)` syntax; the editor
 * parses the image marker and creates an `<img>` element.
 */
export const testMarkdownImage: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-image-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("img"), { timeout: 5_000 }).not.toBeNull();
  const image = el.querySelector<HTMLElement>("img");
  if (image === null) throw new Error("expected an <img> element");
  await expect.element(page.elementLocator(image)).toBeVisible();
  expect(image.getAttribute("src")).toBe("https://example.com/image.png");
  expect(image.getAttribute("alt")).toBe("Example");
};

/**
 * Verify the Markdown extension imports an ordered list and renders `<ol>` with three `<li>`.
 *
 * The import button calls `setContent` with `1. / 2. / 3.` syntax; the editor
 * parses the list and creates an `<ol>` with three items.
 */
export const testMarkdownOrderedList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-ordered-list-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("ol"), { timeout: 5_000 }).not.toBeNull();
  const orderedList = el.querySelector<HTMLElement>("ol");
  if (orderedList === null) throw new Error("expected an <ol> element");
  await expect.element(page.elementLocator(orderedList)).toBeVisible();
  await expect.poll(() => el.querySelectorAll("ol li").length, { timeout: 5_000 }).toBe(3);
};

/**
 * Verify the Markdown extension imports a blockquote and renders `<blockquote>`.
 *
 * The import button calls `setContent` with `> ` syntax; the editor parses
 * the blockquote marker and creates a `<blockquote>` element.
 */
export const testMarkdownBlockquote: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-blockquote-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("blockquote"), { timeout: 5_000 }).not.toBeNull();
  const blockquote = el.querySelector<HTMLElement>("blockquote");
  if (blockquote === null) throw new Error("expected a <blockquote> element");
  await expect.element(page.elementLocator(blockquote)).toBeVisible();
  expect(blockquote.textContent).toContain("This is a quote");
};

/**
 * Verify the Markdown extension imports a horizontal rule and renders `<hr>`.
 *
 * The import button calls `setContent` with `---` syntax; the editor parses
 * the rule and creates an `<hr>` element.
 */
export const testMarkdownHorizontalRule: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-hr-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("hr"), { timeout: 5_000 }).not.toBeNull();
  const hr = el.querySelector<HTMLElement>("hr");
  if (hr === null) throw new Error("expected an <hr> element");
  await expect.element(page.elementLocator(hr)).toBeVisible();
};

/**
 * Verify the Markdown extension imports a table and renders `<table>` with correct cell counts.
 *
 * The import button calls `setContent` with GFM table syntax; the editor
 * parses the table and creates `<th>` header cells and `<td>` data cells.
 */
export const testMarkdownTable: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();

  const importButton = await resolveButton("import-table-button");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("table"), { timeout: 5_000 }).not.toBeNull();
  const table = el.querySelector<HTMLElement>("table");
  if (table === null) throw new Error("expected a <table> element");
  await expect.element(page.elementLocator(table)).toBeVisible();
  await expect.poll(() => el.querySelectorAll("th").length, { timeout: 5_000 }).toBe(2);
  await expect.poll(() => el.querySelectorAll("td").length, { timeout: 5_000 }).toBe(2);
};
