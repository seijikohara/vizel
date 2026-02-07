import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for end-to-end user flow testing.
 * These scenarios verify complete workflows that span multiple features.
 */

const SLASH_MENU_SELECTOR = "[data-vizel-slash-menu]";
const TABLE_WRAPPER_SELECTOR = ".vizel-table-controls-wrapper";
const TABLE_SELECTOR = ".vizel-table";

// ============================================
// 1. Document Creation Flow
// ============================================

/**
 * Test a complete document creation workflow:
 * heading → paragraph → bold/italic formatting → bullet list → verify structure
 */
export async function testDocumentCreationFlow(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Step 1: Create a heading using markdown input rule ("# " → h1)
  await page.keyboard.type("# My Document Title");

  const heading = editor.locator("h1");
  await expect(heading).toContainText("My Document Title");

  // Step 2: Move to new line and type a paragraph
  await page.keyboard.press("Enter");
  await page.keyboard.type("This is the introduction paragraph with ");

  // Step 3: Add bold text
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("bold text");
  await page.keyboard.press("ControlOrMeta+b");

  await page.keyboard.type(" and ");

  // Step 4: Add italic text
  await page.keyboard.press("ControlOrMeta+i");
  await page.keyboard.type("italic text");
  await page.keyboard.press("ControlOrMeta+i");

  await page.keyboard.type(".");

  // Step 5: Add a bullet list
  await page.keyboard.press("Enter");
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  // Verify the complete document structure
  await expect(heading).toContainText("My Document Title");

  const paragraph = editor.locator("p").first();
  await expect(paragraph).toContainText("This is the introduction paragraph");

  const bold = editor.locator("strong");
  await expect(bold).toContainText("bold text");

  const italic = editor.locator("em");
  await expect(italic).toContainText("italic text");

  const listItems = editor.locator("ul li");
  await expect(listItems).toHaveCount(2);
  await expect(listItems.first()).toContainText("First item");
  await expect(listItems.nth(1)).toContainText("Second item");
}

// ============================================
// 2. Markdown Round-Trip Flow
// ============================================

/**
 * Test markdown export → clear → import round-trip:
 * Create content → export to markdown → clear editor → import from exported → verify match
 *
 * Requires a fixture with:
 * - [data-testid="export-button"] — exports markdown to [data-testid="markdown-output"]
 * - [data-testid="clear-button"] — clears the editor
 * - [data-testid="import-from-output-button"] — imports from markdown-output back to editor
 */
export async function testMarkdownRoundTrip(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Step 1: Create mixed content
  await page.keyboard.type("# Round-Trip Test");
  // The heading input rule should convert "# " to h1
  await expect(editor.locator("h1")).toContainText("Round-Trip Test");

  await page.keyboard.press("Enter");
  await page.keyboard.type("A paragraph with ");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("bold");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type(" formatting.");

  // Step 2: Export to markdown
  const exportButton = component.locator("[data-testid='export-button']");
  await exportButton.click();

  const markdownOutput = component.locator("[data-testid='markdown-output']");
  await expect(markdownOutput).not.toHaveText("");

  // Store the exported markdown for comparison
  const exportedMarkdown = await markdownOutput.textContent();
  expect(exportedMarkdown).toBeTruthy();
  expect(exportedMarkdown).toContain("Round-Trip Test");
  expect(exportedMarkdown).toContain("**bold**");

  // Step 3: Clear the editor
  const clearButton = component.locator("[data-testid='clear-button']");
  await clearButton.click();

  // Verify editor is empty
  await expect(editor.locator("h1")).toHaveCount(0);
  await expect(editor.locator("strong")).toHaveCount(0);

  // Step 4: Import from the exported markdown
  const importFromOutputButton = component.locator("[data-testid='import-from-output-button']");
  await importFromOutputButton.click();

  // Step 5: Verify the imported content matches the original structure
  await expect(editor.locator("h1")).toContainText("Round-Trip Test");
  await expect(editor.locator("strong")).toContainText("bold");
  await expect(editor.locator("p")).toContainText("A paragraph with");
}

// ============================================
// 3. Auto-Save Flow
// ============================================

/**
 * Test auto-save workflow:
 * Type content → verify save indicator changes → verify localStorage has content
 *
 * Requires a fixture with:
 * - Auto-save enabled with localStorage backend
 * - [data-testid="save-status"] — shows current save status
 * - Known localStorage key for verification
 */
export async function testAutoSaveFlow(
  component: Locator,
  page: Page,
  storageKey: string
): Promise<void> {
  const editor = component.locator(".vizel-editor");
  const saveStatus = component.locator("[data-testid='save-status']");

  // Step 1: Clear any previous localStorage data
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);

  // Step 2: Type content into the editor
  await editor.click();
  await page.keyboard.type("Auto-save test content");

  // Step 3: Wait for content to be saved to localStorage (primary signal)
  await page.waitForFunction(
    (key) => {
      const data = localStorage.getItem(key);
      return data?.includes("Auto-save test content");
    },
    storageKey,
    { timeout: 5000 }
  );

  // Step 4: Verify save status shows "saved"
  await expect(saveStatus).toHaveText("saved", { timeout: 5000 });

  // Step 5: Type more content and verify save updates
  await page.keyboard.type(" with additional text");

  // Wait for updated content in localStorage
  await page.waitForFunction(
    (key) => {
      const data = localStorage.getItem(key);
      return data?.includes("additional text");
    },
    storageKey,
    { timeout: 5000 }
  );

  await expect(saveStatus).toHaveText("saved", { timeout: 5000 });
}

// ============================================
// 4. Image Upload Flow
// ============================================

const TEST_IMAGE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='%234CAF50'/%3E%3C/svg%3E";

/**
 * Test image upload via slash command:
 * Open slash menu → select image → provide URL → verify image in editor
 */
export async function testImageUploadFlow(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Step 1: Mock window.prompt to return our test image URL
  await page.evaluate((url) => {
    window.prompt = () => url;
  }, TEST_IMAGE_URL);

  // Step 2: Open slash menu and search for image
  await page.keyboard.type("/image");

  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  // Step 3: Select the image URL option
  const imageItem = slashMenu
    .locator(".vizel-slash-menu-item")
    .filter({ hasText: "Insert an image from URL" });
  await imageItem.click();

  // Step 4: Verify slash menu closes
  await expect(slashMenu).not.toBeVisible();

  // Step 5: Verify image is inserted in the editor
  const image = editor.locator("img.vizel-image");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", TEST_IMAGE_URL);
}

// ============================================
// 5. Table Editing Flow
// ============================================

/**
 * Test table editing workflow:
 * Insert table → type in cells → navigate with Tab → verify structure and content
 */
export async function testTableEditingFlow(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Step 1: Insert a table via slash command
  await page.keyboard.type("/table");
  const slashMenu = page.locator(SLASH_MENU_SELECTOR);
  await expect(slashMenu).toBeVisible();

  const tableItem = slashMenu
    .locator(".vizel-slash-menu-item")
    .filter({ hasText: "Insert a table" });
  await tableItem.click();
  await expect(slashMenu).not.toBeVisible();

  // Step 2: Verify initial table structure (3x3 with header)
  const wrapper = editor.locator(TABLE_WRAPPER_SELECTOR);
  await expect(wrapper).toBeVisible();

  const table = wrapper.locator(TABLE_SELECTOR);
  await expect(table).toBeVisible();

  await expect(table.locator("th")).toHaveCount(3);
  await expect(table.locator("td")).toHaveCount(6); // 2 rows x 3 columns

  // Step 3: Type content in header cells by clicking each cell
  await table.locator("th").nth(0).click({ force: true });
  await page.keyboard.type("Name");

  await table.locator("th").nth(1).click({ force: true });
  await page.keyboard.type("Role");

  await table.locator("th").nth(2).click({ force: true });
  await page.keyboard.type("Status");

  // Step 4: Type content in body cells
  await table.locator("td").nth(0).click({ force: true });
  await page.keyboard.type("Alice");

  await table.locator("td").nth(1).click({ force: true });
  await page.keyboard.type("Developer");

  await table.locator("td").nth(2).click({ force: true });
  await page.keyboard.type("Active");

  // Step 5: Verify all header cells
  await expect(table.locator("th").nth(0)).toContainText("Name");
  await expect(table.locator("th").nth(1)).toContainText("Role");
  await expect(table.locator("th").nth(2)).toContainText("Status");

  // Step 6: Verify all body cells in first row
  await expect(table.locator("td").nth(0)).toContainText("Alice");
  await expect(table.locator("td").nth(1)).toContainText("Developer");
  await expect(table.locator("td").nth(2)).toContainText("Active");

  // Step 7: Navigate with Tab and type in second row
  await page.keyboard.press("Tab");
  await page.keyboard.type("Bob");

  // Verify second row content
  await expect(table.locator("td").nth(3)).toContainText("Bob");
}
