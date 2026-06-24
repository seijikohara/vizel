import { expect } from "vitest";
import { page, pressKeyChord, userEvent, type VizelBcScenario } from "./_vitest-context";

// Resolve the ProseMirror contenteditable root. Tiptap mounts asynchronously
// after the framework renders, so poll until the element appears rather than
// querying once. `.vizel-editor` is a div, not an ARIA textbox, so it is
// queried by class.
async function resolveEditor(): Promise<HTMLElement> {
  // Allow a generous window: the full three-browser matrix runs nine browser
  // instances in parallel, and under that contention the asynchronous Tiptap
  // mount can exceed the default 1s poll budget before the editor view appears.
  await expect
    .poll(() => document.querySelector(".vizel-editor"), { timeout: 15_000 })
    .not.toBeNull();
  const el = document.querySelector<HTMLElement>(".vizel-editor");
  if (el === null) throw new Error("expected a .vizel-editor element");
  return el;
}

// Minimal view of the editor instance the reset helper drives. The fixtures
// expose the live editor on `window.vizelTestEditor`; the scenarios reach it
// through this narrow shape rather than importing a framework type into the
// neutral scenario layer.
interface VizelTestEditor {
  commands: {
    clearContent: (emitUpdate?: boolean) => void;
    setContent: (content: unknown) => void;
  };
}

const isVizelTestEditor = (value: unknown): value is VizelTestEditor =>
  typeof value === "object" &&
  value !== null &&
  "commands" in value &&
  typeof (value as { commands?: unknown }).commands === "object";

// Resolve the editor instance the fixture publishes on `window.vizelTestEditor`.
// The fixture assigns the instance inside its mount effect after the
// asynchronous Tiptap mount, so poll rather than read once.
async function resolveTestEditor(): Promise<VizelTestEditor> {
  await expect
    .poll(() => isVizelTestEditor((window as { vizelTestEditor?: unknown }).vizelTestEditor), {
      timeout: 15_000,
    })
    .toBe(true);
  const candidate = (window as { vizelTestEditor?: unknown }).vizelTestEditor;
  if (!isVizelTestEditor(candidate)) {
    throw new Error("expected window.vizelTestEditor; mount a fixture that exposes the editor");
  }
  return candidate;
}

// Verify the editor mounts and is editable.
export const testEditorRenders: VizelBcScenario = async () => {
  const el = await resolveEditor();
  await expect.element(page.elementLocator(el)).toBeVisible();
  expect(el.getAttribute("contenteditable")).toBe("true");
};

// Verify the editor accepts typed text. The interaction proves the userEvent
// API works identically across React, Vue, and Svelte fixtures. `userEvent.type`
// dispatches the same key sequence ProseMirror's contenteditable handler expects.
export const testEditorTyping: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.click(editor);
  await userEvent.type(editor, "Hello, Vizel!");
  await expect.element(editor).toHaveTextContent("Hello, Vizel!");
};

/**
 * Verify the placeholder appears on an empty editor.
 *
 * The placeholder renders through a CSS `::before` pseudo-element that reads the
 * `data-placeholder` attribute, so the scenario asserts the attribute value the
 * fixture configured.
 */
export const testEditorPlaceholder = async (expectedPlaceholder: string): Promise<void> => {
  const el = await resolveEditor();
  await expect
    .poll(() => el.querySelector("[data-placeholder]")?.getAttribute("data-placeholder"), {
      timeout: 5_000,
    })
    .toBe(expectedPlaceholder);
};

// Verify the heading keyboard shortcut converts the selection to an H1.
export const testHeadingShortcut: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "Heading Test");
  await pressKeyChord("Mod", "a");
  await pressKeyChord("Mod", "Alt", "1");
  await expect
    .poll(() => el.querySelector("h1")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Heading Test");
};

// Verify the bold keyboard shortcut wraps typed text in <strong>.
export const testBoldShortcut: VizelBcScenario = async () => {
  const el = await resolveEditor();
  // Click first to place focus: unlike `userEvent.type`, `pressKeyChord` does
  // not focus the element, so the modifier chord would be lost without a prior click.
  await userEvent.click(page.elementLocator(el));
  await pressKeyChord("Mod", "b");
  await userEvent.keyboard("Bold Text");
  await pressKeyChord("Mod", "b");
  await expect
    .poll(() => el.querySelector("strong")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Bold Text");
};

// Verify the italic keyboard shortcut wraps typed text in <em>.
export const testItalicShortcut: VizelBcScenario = async () => {
  const el = await resolveEditor();
  // Click first to place focus: same reason as testBoldShortcut.
  await userEvent.click(page.elementLocator(el));
  await pressKeyChord("Mod", "i");
  await userEvent.keyboard("Italic Text");
  await pressKeyChord("Mod", "i");
  await expect
    .poll(() => el.querySelector("em")?.textContent ?? "", { timeout: 5_000 })
    .toContain("Italic Text");
};

// Verify the "- " input rule builds a two-item bullet list.
export const testBulletList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "- First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  await expect.poll(() => el.querySelector("ul"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelectorAll("li").length).toBe(2);
};

// Verify the "1. " input rule builds a two-item ordered list.
export const testOrderedList: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "1. First item");
  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second item");

  await expect.poll(() => el.querySelector("ol"), { timeout: 5_000 }).not.toBeNull();
  await expect.poll(() => el.querySelectorAll("li").length).toBe(2);
};

// Verify the "[ ] " input rule builds a two-item task list.
export const testTaskListInputRule: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "[[ ] First task");
  await expect.poll(() => el.querySelector(".vizel-task-list"), { timeout: 5_000 }).not.toBeNull();

  await userEvent.keyboard("{Enter}");
  await userEvent.type(editor, "Second task");
  await expect.poll(() => el.querySelectorAll(".vizel-task-item").length).toBe(2);
};

// Verify clicking a task-list checkbox toggles its checked state.
export const testTaskListCheckboxToggle: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "[[ ] Task to complete");
  await expect.poll(() => el.querySelector(".vizel-task-item"), { timeout: 5_000 }).not.toBeNull();

  const taskItem = el.querySelector<HTMLElement>(".vizel-task-item");
  if (taskItem === null) throw new Error("expected a .vizel-task-item element");
  const checkbox = taskItem.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (checkbox === null) throw new Error("expected a task-item checkbox");

  await expect.element(page.elementLocator(checkbox)).not.toBeChecked();
  expect(taskItem.getAttribute("data-checked")).toBe("false");

  await userEvent.click(page.elementLocator(checkbox));
  await expect.element(page.elementLocator(checkbox)).toBeChecked();
  await expect.poll(() => taskItem.getAttribute("data-checked"), { timeout: 5_000 }).toBe("true");
};

// Verify the "[x] " input rule builds a pre-checked task item.
export const testTaskListCheckedInputRule: VizelBcScenario = async () => {
  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "[[x] Completed task");
  await expect.poll(() => el.querySelector(".vizel-task-item"), { timeout: 5_000 }).not.toBeNull();

  const taskItem = el.querySelector<HTMLElement>(".vizel-task-item");
  if (taskItem === null) throw new Error("expected a .vizel-task-item element");
  const checkbox = taskItem.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (checkbox === null) throw new Error("expected a task-item checkbox");

  await expect.element(page.elementLocator(checkbox)).toBeChecked();
  expect(taskItem.getAttribute("data-checked")).toBe("true");
};

// Inject host CSS into the document head. The scenarios run in the browser, so
// they append a <style> directly instead of Playwright's `page.addStyleTag`.
function injectHostStyle(content: string): void {
  const style = document.createElement("style");
  style.textContent = content;
  document.head.appendChild(style);
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
export const testListMarkersSurviveHostReset: VizelBcScenario = async () => {
  injectHostStyle("@layer base { ol, ul, menu { list-style: none; } }");

  const el = await resolveEditor();
  const editor = page.elementLocator(el);

  // Build a bullet list, an ordered list, and a task list as separate blocks.
  await userEvent.type(editor, "- Bullet item");
  await userEvent.keyboard("{Enter}{Enter}");
  await userEvent.type(editor, "1. Ordered item");
  await userEvent.keyboard("{Enter}{Enter}");
  await userEvent.type(editor, "[[ ] Task item");

  await expect
    .poll(() => el.querySelector("ul:not([data-type='taskList'])"), { timeout: 5_000 })
    .not.toBeNull();
  await expect.poll(() => el.querySelector("ol"), { timeout: 5_000 }).not.toBeNull();
  await expect
    .poll(() => el.querySelector("ul[data-type='taskList']"), { timeout: 5_000 })
    .not.toBeNull();

  const bulletList = el.querySelector("ul:not([data-type='taskList'])");
  const orderedList = el.querySelector("ol");
  const taskList = el.querySelector("ul[data-type='taskList']");
  if (bulletList === null || orderedList === null || taskList === null) {
    throw new Error("expected bullet, ordered, and task lists");
  }

  expect(getComputedStyle(bulletList).listStyleType).toBe("disc");
  expect(getComputedStyle(orderedList).listStyleType).toBe("decimal");
  expect(getComputedStyle(taskList).listStyleType).toBe("none");
};

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

/**
 * Verify inter-block spacing inside nested containers survives a host CSS reset.
 *
 * Callouts, details, blockquotes, and table cells set no paragraph or heading
 * margin of their own, so they relied on the User-Agent default that a host
 * reset removes. Each container now restores an explicit `> * + *` gap that, as
 * unlayered CSS, wins over the layered reset. Regression guard for issue #666.
 */
export const testBlockSpacingSurvivesHostReset: VizelBcScenario = async () => {
  injectHostStyle(VIZEL_PREFLIGHT_RESET);
  const editor = await resolveTestEditor();
  // A JS object bypasses the markdown setContent override and loads as JSON.
  editor.commands.setContent(VIZEL_RESET_DOC);

  const el = await resolveEditor();
  const containers = [
    "blockquote > * + *",
    ".vizel-callout > * + *",
    ".vizel-details-content > * + *",
    ".vizel-table-cell > * + *",
  ];
  for (const selector of containers) {
    await expect.poll(() => el.querySelector(selector), { timeout: 5_000 }).not.toBeNull();
    const secondChild = el.querySelector(selector);
    if (secondChild === null) throw new Error(`expected an element for ${selector}`);
    expect(
      getComputedStyle(secondChild).marginTop,
      `${selector} keeps a top margin under a host reset`
    ).not.toBe("0px");
  }
};

/**
 * Verify the link-editor input keeps an opaque surface under a host CSS reset.
 *
 * Preflight sets `input { background-color: transparent }`; the field now
 * declares an explicit background so the popover does not show through it.
 * Regression guard for issue #666.
 */
export const testLinkInputBackgroundSurvivesHostReset: VizelBcScenario = async () => {
  injectHostStyle(VIZEL_PREFLIGHT_RESET);

  const el = await resolveEditor();
  const editor = page.elementLocator(el);
  await userEvent.type(editor, "Linkable text");
  await pressKeyChord("Mod", "a");

  // The bubble menu appears on selection and is positioned asynchronously by
  // floating-ui; the link input then mounts after its action click. Under the
  // contended Firefox run both can exceed a short budget, so poll generously.
  await expect
    .poll(() => document.querySelector("[data-vizel-bubble-menu]"), { timeout: 15_000 })
    .not.toBeNull();
  const bubbleMenu = document.querySelector<HTMLElement>("[data-vizel-bubble-menu]");
  if (bubbleMenu === null) throw new Error("expected a bubble menu");
  const linkAction = bubbleMenu.querySelector<HTMLElement>('[data-action="link"]');
  if (linkAction === null) throw new Error("expected a link action in the bubble menu");
  await userEvent.click(page.elementLocator(linkAction));

  await expect
    .poll(() => document.querySelector(".vizel-link-input"), { timeout: 15_000 })
    .not.toBeNull();
  const input = document.querySelector<HTMLElement>(".vizel-link-input");
  if (input === null) throw new Error("expected a link input");
  const background = getComputedStyle(input).backgroundColor;
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
  expect(background).not.toBe("transparent");
};
