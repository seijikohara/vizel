import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared test scenarios for editor functionality.
 * These scenarios are framework-agnostic and can be used with React, Vue, and Svelte.
 */

/** Verify the editor is rendered and editable */
export async function testEditorRenders(component: Locator): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("contenteditable", "true");
}

/** Verify typing text into the editor */
export async function testEditorTyping(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Hello, Vizel!");
  await expect(editor).toContainText("Hello, Vizel!");
}

/** Verify placeholder is shown when editor is empty */
export async function testEditorPlaceholder(
  component: Locator,
  expectedPlaceholder: string
): Promise<void> {
  // Placeholder is rendered via CSS ::before pseudo-element with data-placeholder attribute
  const editor = component.locator(".vizel-editor");
  await expect(editor.locator("[data-placeholder]")).toHaveAttribute(
    "data-placeholder",
    expectedPlaceholder
  );
}

/** Verify heading formatting with keyboard shortcut */
export async function testHeadingShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Heading Test");

  // Select all text
  await page.keyboard.press("ControlOrMeta+a");

  // Apply heading (Ctrl/Cmd + Alt + 1)
  await page.keyboard.press("ControlOrMeta+Alt+1");

  const heading = editor.locator("h1");
  await expect(heading).toContainText("Heading Test");
}

/** Verify bold formatting with keyboard shortcut */
export async function testBoldShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type with bold shortcut
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("Bold Text");
  await page.keyboard.press("ControlOrMeta+b");

  const bold = editor.locator("strong");
  await expect(bold).toContainText("Bold Text");
}

/** Verify italic formatting with keyboard shortcut */
export async function testItalicShortcut(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Type with italic shortcut
  await page.keyboard.press("ControlOrMeta+i");
  await page.keyboard.type("Italic Text");
  await page.keyboard.press("ControlOrMeta+i");

  const italic = editor.locator("em");
  await expect(italic).toContainText("Italic Text");
}

/** Verify bullet list creation */
export async function testBulletList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create bullet list
  await page.keyboard.type("- First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  const list = editor.locator("ul");
  await expect(list).toBeVisible();

  const items = editor.locator("li");
  await expect(items).toHaveCount(2);
}

/** Verify ordered list creation */
export async function testOrderedList(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create ordered list
  await page.keyboard.type("1. First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  const list = editor.locator("ol");
  await expect(list).toBeVisible();

  const items = editor.locator("li");
  await expect(items).toHaveCount(2);
}

/** Verify task list creation with input rule */
export async function testTaskListInputRule(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create task list with [ ] input rule - needs space after ] to trigger
  await page.keyboard.type("[ ] First task");

  // Wait for task list to be created (use class selector)
  const taskList = editor.locator(".vizel-task-list");
  await expect(taskList).toBeVisible({ timeout: 3000 });

  // Continue with second task
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second task");

  const taskItems = editor.locator(".vizel-task-item");
  await expect(taskItems).toHaveCount(2);
}

/** Verify task list checkbox toggle */
export async function testTaskListCheckboxToggle(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create task list with [ ] input rule
  await page.keyboard.type("[ ] Task to complete");

  // Wait for task list to be created first (use class selector)
  const taskList = editor.locator(".vizel-task-list");
  await expect(taskList).toBeVisible({ timeout: 3000 });

  // Find the task item - checkbox is inside label due to nested: true option
  const taskItem = editor.locator(".vizel-task-item");
  await expect(taskItem).toBeVisible();

  // Find checkbox within task item (may be nested in label)
  const checkbox = taskItem.locator("input[type='checkbox']");
  await expect(checkbox).toBeVisible();

  // Initially unchecked
  await expect(checkbox).not.toBeChecked();
  await expect(taskItem).toHaveAttribute("data-checked", "false");

  // Click to check
  await checkbox.click();
  await expect(checkbox).toBeChecked();

  // Task item should have data-checked attribute
  await expect(taskItem).toHaveAttribute("data-checked", "true");
}

/** Verify task list created with [x] input rule is pre-checked */
export async function testTaskListCheckedInputRule(component: Locator, page: Page): Promise<void> {
  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Create checked task with [x] input rule
  await page.keyboard.type("[x] Completed task");

  // Wait for task list to be created first (use class selector)
  const taskList = editor.locator(".vizel-task-list");
  await expect(taskList).toBeVisible({ timeout: 3000 });

  const taskItem = editor.locator(".vizel-task-item");
  await expect(taskItem).toBeVisible();

  const checkbox = taskItem.locator("input[type='checkbox']");
  await expect(checkbox).toBeChecked();

  await expect(taskItem).toHaveAttribute("data-checked", "true");
}

/**
 * Verify content list markers survive a host CSS reset.
 *
 * Tailwind v4 Preflight emits `@layer base { ol, ul, menu { list-style: none } }`,
 * which strips the User-Agent bullet and number markers. Vizel ships unlayered
 * CSS, so its explicit `list-style-type` wins over the layered reset for content
 * lists, while the task-list opt-out stays marker-less. Regression guard for
 * issue #666.
 */
export async function testListMarkersSurviveHostReset(
  component: Locator,
  page: Page
): Promise<void> {
  // Reproduce Tailwind Preflight: a layered reset that removes the UA markers.
  await page.addStyleTag({ content: "@layer base { ol, ul, menu { list-style: none; } }" });

  const editor = component.locator(".vizel-editor");
  await editor.click();

  // Build a bullet list, an ordered list, and a task list as separate blocks.
  await page.keyboard.type("- Bullet item");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("1. Ordered item");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("[ ] Task item");

  const bulletList = editor.locator("ul:not([data-type='taskList'])").first();
  const orderedList = editor.locator("ol").first();
  const taskList = editor.locator("ul[data-type='taskList']").first();

  await expect(bulletList).toBeVisible();
  await expect(orderedList).toBeVisible();
  await expect(taskList).toBeVisible({ timeout: 3000 });

  const bulletMarker = await bulletList.evaluate((el) => getComputedStyle(el).listStyleType);
  const orderedMarker = await orderedList.evaluate((el) => getComputedStyle(el).listStyleType);
  const taskMarker = await taskList.evaluate((el) => getComputedStyle(el).listStyleType);

  expect(bulletMarker).toBe("disc");
  expect(orderedMarker).toBe("decimal");
  expect(taskMarker).toBe("none");
}

/**
 * A Tailwind v4 Preflight-like reset scoped to `@layer base`. It strips the
 * User-Agent defaults Vizel must not depend on: margins, padding, borders, list
 * markers, heading sizing, and the native input background.
 */
const VIZEL_PREFLIGHT_RESET = `@layer base {
  *, ::before, ::after { margin: 0; padding: 0; border: 0 solid; }
  ol, ul, menu { list-style: none; }
  h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
  input, textarea, select, button { background-color: transparent; }
}`;

/**
 * A document whose nested containers each hold two block siblings, so a missing
 * inter-block margin is observable. The table cell pairs a paragraph with a
 * heading because the cell paragraph reset keeps paragraphs flush; the heading
 * is the block that must regain spacing.
 */
const VIZEL_RESET_DOC = {
  type: "doc",
  content: [
    {
      type: "blockquote",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Quote paragraph one." }] },
        { type: "paragraph", content: [{ type: "text", text: "Quote paragraph two." }] },
      ],
    },
    {
      type: "callout",
      attrs: { type: "info" },
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Callout paragraph one." }] },
        { type: "paragraph", content: [{ type: "text", text: "Callout paragraph two." }] },
      ],
    },
    {
      type: "details",
      attrs: { open: true },
      content: [
        { type: "detailsSummary", content: [{ type: "text", text: "Summary" }] },
        {
          type: "detailsContent",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Details paragraph one." }] },
            { type: "paragraph", content: [{ type: "text", text: "Details paragraph two." }] },
          ],
        },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Cell paragraph." }] },
                {
                  type: "heading",
                  attrs: { level: 3 },
                  content: [{ type: "text", text: "Cell heading" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Seed the editor with rich block content through the exposed test editor. */
async function seedResetDoc(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor)
  );
  await page.evaluate((doc) => {
    const win = window as unknown as {
      vizelTestEditor: { commands: { setContent: (content: unknown) => void } };
    };
    // A JS object bypasses the markdown setContent override and loads as JSON.
    win.vizelTestEditor.commands.setContent(doc);
  }, VIZEL_RESET_DOC);
}

/**
 * Verify inter-block spacing inside nested containers survives a host CSS reset.
 *
 * Callouts, details, blockquotes, and table cells set no paragraph or heading
 * margin of their own, so they relied on the User-Agent default that a host
 * reset removes. Each container now restores an explicit `> * + *` gap that, as
 * unlayered CSS, wins over the layered reset. Regression guard for issue #666.
 */
export async function testBlockSpacingSurvivesHostReset(
  component: Locator,
  page: Page
): Promise<void> {
  await page.addStyleTag({ content: VIZEL_PREFLIGHT_RESET });
  await seedResetDoc(page);

  const editor = component.locator(".vizel-editor");
  const containers = [
    "blockquote > * + *",
    ".vizel-callout > * + *",
    ".vizel-details-content > * + *",
    ".vizel-table-cell > * + *",
  ];
  for (const selector of containers) {
    const secondChild = editor.locator(selector).first();
    await expect(secondChild).toBeVisible();
    const marginTop = await secondChild.evaluate((node) => getComputedStyle(node).marginTop);
    expect(marginTop, `${selector} keeps a top margin under a host reset`).not.toBe("0px");
  }
}

/**
 * Verify the link-editor input keeps an opaque surface under a host CSS reset.
 *
 * Preflight sets `input { background-color: transparent }`; the field now
 * declares an explicit background so the popover does not show through it.
 * Regression guard for issue #666.
 */
export async function testLinkInputBackgroundSurvivesHostReset(
  component: Locator,
  page: Page
): Promise<void> {
  await page.addStyleTag({ content: VIZEL_PREFLIGHT_RESET });

  const editor = component.locator(".vizel-editor");
  await editor.click();
  await page.keyboard.type("Linkable text");
  await page.keyboard.press("ControlOrMeta+a");

  const bubbleMenu = component.locator("[data-vizel-bubble-menu]");
  await expect(bubbleMenu).toBeVisible();
  await bubbleMenu.locator('[data-action="link"]').click();

  const input = component.locator(".vizel-link-input");
  await expect(input).toBeVisible();
  const background = await input.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
  expect(background).not.toBe("transparent");
}
