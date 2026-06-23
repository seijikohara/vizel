import { expect } from "vitest";
import { page, userEvent, type VizelBcScenario } from "./_vitest-context";

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

/**
 * Verify the editor serializes callouts as GFM alert syntax (> [!NOTE]).
 *
 * GFM uses uppercase alert type keywords; the fixture must be mounted with
 * `flavor="gfm"` for this assertion to hold.
 */
export const testCalloutGfmOutput: VizelBcScenario = async () => {
  await resolveEditor();

  const insertButton = await resolveButton("insert-callout");
  await userEvent.click(page.elementLocator(insertButton));

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toMatch(/>\s*\[!NOTE\]/);
  expect(output.textContent).toContain("Test callout content");
};

/**
 * Verify the editor serializes callouts as Obsidian callout syntax (> [!info]).
 *
 * Obsidian uses lowercase type keywords; the fixture must be mounted with
 * `flavor="obsidian"` for this assertion to hold.
 */
export const testCalloutObsidianOutput: VizelBcScenario = async () => {
  await resolveEditor();

  const insertButton = await resolveButton("insert-callout");
  await userEvent.click(page.elementLocator(insertButton));

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toMatch(/>\s*\[!info\]/);
  expect(output.textContent).toContain("Test callout content");
};

/**
 * Verify the editor serializes callouts as Docusaurus directive syntax (:::info).
 *
 * The fixture must be mounted with `flavor="docusaurus"` for this assertion to hold.
 */
export const testCalloutDocusaurusOutput: VizelBcScenario = async () => {
  await resolveEditor();

  const insertButton = await resolveButton("insert-callout");
  await userEvent.click(page.elementLocator(insertButton));

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toContain(":::info");
  expect(output.textContent).toContain("Test callout content");
  expect(output.textContent).toContain(":::");
};

/**
 * Verify the editor serializes callouts as CommonMark blockquote fallback (> **Info**:).
 *
 * CommonMark has no native callout syntax, so the serializer falls back to a
 * bold-label blockquote. The fixture must be mounted with `flavor="commonmark"`.
 */
export const testCalloutCommonmarkOutput: VizelBcScenario = async () => {
  await resolveEditor();

  const insertButton = await resolveButton("insert-callout");
  await userEvent.click(page.elementLocator(insertButton));

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect
    .poll(() => output.textContent ?? "", { timeout: 5_000 })
    .toMatch(/>\s*\*\*Info\*\*:/);
  expect(output.textContent).toContain("Test callout content");
};

/**
 * Verify GFM-style callout markdown (> [!NOTE]) is parsed correctly regardless
 * of the configured output flavor.
 *
 * Input parsing is always tolerant: all known callout syntaxes are accepted even
 * when the output serializer targets a different flavor.
 */
export const testCalloutParseGfm: VizelBcScenario = async () => {
  const el = await resolveEditor();

  const importButton = await resolveButton("import-callout-gfm");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("[data-callout]"), { timeout: 5_000 }).not.toBeNull();

  const callout = el.querySelector<HTMLElement>("[data-callout]");
  if (callout === null) throw new Error("expected a [data-callout] element");
  await expect.element(page.elementLocator(callout)).toBeVisible();
  expect(callout.textContent).toContain("GFM callout content");
};

/**
 * Verify Obsidian-style callout markdown (> [!note]) is parsed correctly
 * regardless of the configured output flavor.
 */
export const testCalloutParseObsidian: VizelBcScenario = async () => {
  const el = await resolveEditor();

  const importButton = await resolveButton("import-callout-obsidian");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("[data-callout]"), { timeout: 5_000 }).not.toBeNull();

  const callout = el.querySelector<HTMLElement>("[data-callout]");
  if (callout === null) throw new Error("expected a [data-callout] element");
  await expect.element(page.elementLocator(callout)).toBeVisible();
  expect(callout.textContent).toContain("Obsidian callout content");
};

/**
 * Verify Docusaurus-style callout markdown (:::info ... :::) is parsed correctly
 * regardless of the configured output flavor.
 */
export const testCalloutParseDocusaurus: VizelBcScenario = async () => {
  const el = await resolveEditor();

  const importButton = await resolveButton("import-callout-docusaurus");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("[data-callout]"), { timeout: 5_000 }).not.toBeNull();

  const callout = el.querySelector<HTMLElement>("[data-callout]");
  if (callout === null) throw new Error("expected a [data-callout] element");
  await expect.element(page.elementLocator(callout)).toBeVisible();
  expect(callout.textContent).toContain("Docusaurus callout content");
};

/**
 * Verify the import-then-export roundtrip produces output matching the
 * configured flavor's syntax.
 *
 * The fixture always imports GFM-style callout markdown (all flavors accept
 * it), then exports and checks that the output matches `expectedPattern`.
 * This separates the parse path from the serialize path.
 */
export const testCalloutRoundtrip = async (expectedPattern: RegExp): Promise<void> => {
  const el = await resolveEditor();

  const importButton = await resolveButton("import-callout-gfm");
  await userEvent.click(page.elementLocator(importButton));

  await expect.poll(() => el.querySelector("[data-callout]"), { timeout: 5_000 }).not.toBeNull();

  const exportButton = await resolveButton("export-button");
  await userEvent.click(page.elementLocator(exportButton));

  const output = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (output === null) throw new Error("expected [data-testid='markdown-output']");

  await expect.poll(() => output.textContent ?? "", { timeout: 5_000 }).toMatch(expectedPattern);
};
