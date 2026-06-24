import { expect } from "vitest";
import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

/**
 * Shared, framework-agnostic Vitest Browser scenarios for end-to-end user flow
 * testing. These scenarios verify complete workflows that span multiple features.
 */

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";
const TABLE_WRAPPER_SELECTOR = ".vizel-table-controls-wrapper";
const TABLE_SELECTOR = ".vizel-table";
const EDITOR_SELECTOR = ".vizel-editor";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears rather than
// querying once.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and under that contention the asynchronous Tiptap
  // mount can exceed the default 1s poll budget before the editor view appears.
  await expect
    .poll(() => document.querySelector(EDITOR_SELECTOR), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(EDITOR_SELECTOR);
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// ============================================
// 1. Document Creation Flow
// ============================================

/**
 * Verify a complete document creation workflow:
 * heading → paragraph → bold/italic formatting → bullet list → structure check.
 */
export const testDocumentCreationFlow: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Step 1: Create a heading using the markdown input rule ("# " → h1).
  await userEvent.keyboard("# My Document Title");

  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("My Document Title");

  // Step 2: Move to a new line and type a paragraph.
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("This is the introduction paragraph with ");

  // Step 3: Add bold text.
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard("bold text");
  await pressKeyChord("Mod", "b");

  await userEvent.keyboard(" and ");

  // Step 4: Add italic text.
  await pressKeyChord("Mod", "i");
  await userEvent.keyboard("italic text");
  await pressKeyChord("Mod", "i");

  await userEvent.keyboard(".");

  // Step 5: Add a bullet list.
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("Second item");

  // Verify the complete document structure.
  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("My Document Title");

  // The first paragraph contains the introduction text.
  await expect
    .poll(
      () => {
        const paragraphs = el.querySelectorAll("p");
        return Array.from(paragraphs).some((p) =>
          p.textContent?.includes("This is the introduction paragraph")
        );
      },
      { timeout: 5_000 }
    )
    .toBe(true);

  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("bold text");

  await expect
    .poll(() => el.querySelector("em")?.textContent ?? "", { timeout: 5_000 })
    .toContain("italic text");

  await expect.poll(() => el.querySelectorAll("ul li").length, { timeout: 5_000 }).toBe(2);

  await expect
    .poll(() => el.querySelectorAll("ul li")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("First item");

  await expect
    .poll(() => el.querySelectorAll("ul li")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Second item");
};

// ============================================
// 2. Markdown Round-Trip Flow
// ============================================

/**
 * Verify a markdown export → clear → import round-trip:
 * create content → export to markdown → clear → import from exported → verify match.
 *
 * Requires a fixture that exposes:
 *   [data-testid="export-button"] — triggers markdown export to [data-testid="markdown-output"]
 *   [data-testid="clear-button"] — clears the editor
 *   [data-testid="import-from-output-button"] — imports from markdown-output back to the editor
 */
export const testMarkdownRoundTrip: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Step 1: Create mixed content.
  await userEvent.keyboard("# Round-Trip Test");
  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Round-Trip Test");

  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("A paragraph with ");
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard("bold");
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard(" formatting.");

  // Step 2: Export to markdown.
  const exportButton = document.querySelector<HTMLElement>("[data-testid='export-button']");
  if (exportButton === null) throw new Error("expected a [data-testid='export-button'] element");
  await userEvent.click(page.elementLocator(exportButton));

  const markdownOutput = document.querySelector<HTMLElement>("[data-testid='markdown-output']");
  if (markdownOutput === null)
    throw new Error("expected a [data-testid='markdown-output'] element");

  // Wait for the output to become non-empty after clicking Export.
  await expect.poll(() => markdownOutput.textContent ?? "", { timeout: 5_000 }).not.toBe("");

  const exportedMarkdown = markdownOutput.textContent ?? "";
  expect(exportedMarkdown).toBeTruthy();
  expect(exportedMarkdown).toContain("Round-Trip Test");
  expect(exportedMarkdown).toContain("**bold**");

  // Step 3: Clear the editor.
  const clearButton = document.querySelector<HTMLElement>("[data-testid='clear-button']");
  if (clearButton === null) throw new Error("expected a [data-testid='clear-button'] element");
  await userEvent.click(page.elementLocator(clearButton));

  await expect.poll(() => el.querySelectorAll("h1").length, { timeout: 5_000 }).toBe(0);
  await expect.poll(() => el.querySelectorAll("strong").length, { timeout: 5_000 }).toBe(0);

  // Step 4: Import from the exported markdown.
  const importButton = document.querySelector<HTMLElement>(
    "[data-testid='import-from-output-button']"
  );
  if (importButton === null)
    throw new Error("expected a [data-testid='import-from-output-button'] element");
  await userEvent.click(page.elementLocator(importButton));

  // Step 5: Verify the imported content matches the original structure.
  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Round-Trip Test");
  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("bold");
  await expect
    .poll(
      () => {
        const paragraphs = el.querySelectorAll("p");
        return Array.from(paragraphs).some((p) => p.textContent?.includes("A paragraph with"));
      },
      { timeout: 5_000 }
    )
    .toBe(true);
};

// ============================================
// 3. Auto-Save Flow
// ============================================

/**
 * Verify auto-save workflow:
 * type content → verify localStorage receives it → verify save indicator shows "saved".
 *
 * Requires a fixture with auto-save enabled using localStorage and a
 * [data-testid="save-status"] element.
 */
export const testAutoSaveFlow = async (storageKey: string): Promise<void> => {
  const el = await resolveEditor();
  const saveStatus = document.querySelector<HTMLElement>("[data-testid='save-status']");
  if (saveStatus === null) throw new Error("expected a [data-testid='save-status'] element");

  // Step 1: Clear any previous localStorage data so the test starts clean.
  localStorage.removeItem(storageKey);

  // Step 2: Type content into the editor.
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.keyboard("Auto-save test content");

  // Step 3: Wait for the content to be saved to localStorage (primary signal).
  await expect
    .poll(
      () => {
        const data = localStorage.getItem(storageKey);
        return data?.includes("Auto-save test content") ?? false;
      },
      { timeout: 5_000 }
    )
    .toBe(true);

  // Step 4: Verify the save status shows "saved".
  await expect.element(page.elementLocator(saveStatus)).toHaveTextContent("saved");

  // Step 5: Type more content and verify the save updates.
  await userEvent.keyboard(" with additional text");

  await expect
    .poll(
      () => {
        const data = localStorage.getItem(storageKey);
        return data?.includes("additional text") ?? false;
      },
      { timeout: 5_000 }
    )
    .toBe(true);

  await expect.element(page.elementLocator(saveStatus)).toHaveTextContent("saved");
};

// ============================================
// 4. Image Upload Flow
// ============================================

const TEST_IMAGE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='%234CAF50'/%3E%3C/svg%3E";

/**
 * Verify image insertion via the slash command:
 * open slash menu → select image URL option → verify image appears in editor.
 *
 * The window.prompt is replaced with a stub that returns the test image URL so
 * the fixture does not try to open a native dialog.
 */
export const testImageUploadFlow: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Step 1: Stub window.prompt so the image-URL command gets the test URL
  // without opening a native dialog, which is unavailable in automated runs.
  window.prompt = () => TEST_IMAGE_URL;

  // Step 2: Open the slash menu and search for image.
  await userEvent.keyboard("/image");

  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
  const slashMenu = document.querySelector<HTMLElement>(SLASH_MENU_SELECTOR);
  if (slashMenu === null) throw new Error("expected a [data-vizel-slash-menu] element");
  await expect.element(page.elementLocator(slashMenu)).toBeVisible();

  // Step 3: Find and click the "Insert an image from URL" menu item.
  await expect
    .poll(
      () => {
        const items = slashMenu.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).find((item) =>
          item.textContent?.includes("Insert an image from URL")
        );
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const imageItem = Array.from(
    slashMenu.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Insert an image from URL"));
  if (imageItem === undefined)
    throw new Error('expected an "Insert an image from URL" slash menu item');
  await userEvent.click(page.elementLocator(imageItem));

  // Step 4: Verify the slash menu closes after selection.
  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .toBeNull();

  // Step 5: Verify the image is inserted in the editor.
  await expect.poll(() => el.querySelector("img.vizel-image"), { timeout: 5_000 }).not.toBeNull();
  const image = el.querySelector<HTMLImageElement>("img.vizel-image");
  if (image === null) throw new Error("expected an img.vizel-image element");
  await expect.element(page.elementLocator(image)).toBeVisible();
  await expect.element(page.elementLocator(image)).toHaveAttribute("src", TEST_IMAGE_URL);
};

// ============================================
// 5. Table Editing Flow
// ============================================

/**
 * Verify table editing workflow:
 * insert table via slash command → type in cells → navigate with Tab → verify structure.
 */
export const testTableEditingFlow: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);

  // Step 1: Insert a table via the slash command.
  await userEvent.keyboard("/table");

  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
  const slashMenu = document.querySelector<HTMLElement>(SLASH_MENU_SELECTOR);
  if (slashMenu === null) throw new Error("expected a [data-vizel-slash-menu] element");

  await expect
    .poll(
      () => {
        const items = slashMenu.querySelectorAll<HTMLElement>(".vizel-slash-menu-item");
        return Array.from(items).find((item) => item.textContent?.includes("Insert a table"));
      },
      { timeout: 5_000 }
    )
    .not.toBeNull();
  const tableItem = Array.from(
    slashMenu.querySelectorAll<HTMLElement>(".vizel-slash-menu-item")
  ).find((item) => item.textContent?.includes("Insert a table"));
  if (tableItem === undefined) throw new Error('expected an "Insert a table" slash menu item');
  await userEvent.click(page.elementLocator(tableItem));

  await expect
    .poll(() => document.querySelector(SLASH_MENU_SELECTOR), { timeout: 5_000 })
    .toBeNull();

  // Step 2: Verify the initial table structure (3×3 with header row).
  await expect
    .poll(() => el.querySelector(TABLE_WRAPPER_SELECTOR), { timeout: 5_000 })
    .not.toBeNull();
  const wrapper = el.querySelector<HTMLElement>(TABLE_WRAPPER_SELECTOR);
  if (wrapper === null) throw new Error("expected a .vizel-table-controls-wrapper element");
  await expect.element(page.elementLocator(wrapper)).toBeVisible();

  await expect.poll(() => wrapper.querySelector(TABLE_SELECTOR), { timeout: 5_000 }).not.toBeNull();
  const table = wrapper.querySelector<HTMLElement>(TABLE_SELECTOR);
  if (table === null) throw new Error("expected a .vizel-table element");
  await expect.element(page.elementLocator(table)).toBeVisible();

  await expect.poll(() => table.querySelectorAll("th").length, { timeout: 5_000 }).toBe(3);
  // 2 body rows × 3 columns = 6 data cells.
  await expect.poll(() => table.querySelectorAll("td").length, { timeout: 5_000 }).toBe(6);

  // Step 3: Type content in the header cells by clicking each one.
  const headers = () => table.querySelectorAll<HTMLElement>("th");

  await userEvent.click(page.elementLocator(headers()[0]));
  await userEvent.keyboard("Name");

  await userEvent.click(page.elementLocator(headers()[1]));
  await userEvent.keyboard("Role");

  await userEvent.click(page.elementLocator(headers()[2]));
  await userEvent.keyboard("Status");

  // Step 4: Type content in the body cells.
  const cells = () => table.querySelectorAll<HTMLElement>("td");

  await userEvent.click(page.elementLocator(cells()[0]));
  await userEvent.keyboard("Alice");

  await userEvent.click(page.elementLocator(cells()[1]));
  await userEvent.keyboard("Developer");

  await userEvent.click(page.elementLocator(cells()[2]));
  await userEvent.keyboard("Active");

  // Step 5: Verify all header cells contain the expected text.
  await expect
    .poll(() => table.querySelectorAll("th")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Name");
  await expect
    .poll(() => table.querySelectorAll("th")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Role");
  await expect
    .poll(() => table.querySelectorAll("th")[2]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Status");

  // Step 6: Verify all body cells in the first row contain the expected text.
  await expect
    .poll(() => table.querySelectorAll("td")[0]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Alice");
  await expect
    .poll(() => table.querySelectorAll("td")[1]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Developer");
  await expect
    .poll(() => table.querySelectorAll("td")[2]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Active");

  // Step 7: Navigate with Tab and type in the second row.
  await userEvent.keyboard("{Tab}");
  await userEvent.keyboard("Bob");

  await expect
    .poll(() => table.querySelectorAll("td")[3]?.textContent ?? "", { timeout: 5_000 })
    .toContain("Bob");
};
