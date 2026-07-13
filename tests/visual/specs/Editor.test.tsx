import { Vizel } from "@vizel/react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

// Load the component styles: the Vitest config does not inject them globally, and
// a visual snapshot is meaningless without them.
import "@vizel/core/styles/index.scss";

const SAMPLE_MARKDOWN = `# Vizel Editor

Vizel is a block-based visual Markdown editor built on Tiptap.

## Lists

- Top-level item A
- Top-level item B
  - Nested item B.1
  - Nested item B.2
- Top-level item C

1. Ordered first
2. Ordered second

## Code

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

> A blockquote with **bold** and *italic* text.
`;

const PLAIN_MARKDOWN = `# Plain heading

A single paragraph.`;

// Allow a 2% pixel-mismatch budget so antialiasing and subpixel rendering
// differences between the recording machine and another environment do not fail
// the comparison. This mirrors the Playwright suite's prior `maxDiffPixelRatio`.
const SCREENSHOT_OPTIONS = {
  comparatorName: "pixelmatch",
  comparatorOptions: { allowedMismatchedPixelRatio: 0.02 },
} as const;

// Suppress caret blink so the snapshot pixels are deterministic.
function suppressCaret(): void {
  const style = document.createElement("style");
  style.textContent = ".ProseMirror { caret-color: transparent !important; }";
  document.head.appendChild(style);
}

async function resolveVizelRoot() {
  await expect
    .poll(() => document.querySelector(".ProseMirror"), { timeout: 15_000 })
    .not.toBeNull();
  const root = document.querySelector<HTMLElement>(".vizel-root");
  if (root === null) throw new Error("expected a .vizel-root element");
  return page.elementLocator(root);
}

describe("VizelEditor visual regression (Vitest Browser)", () => {
  test("light theme renders the sample document with default chrome", async () => {
    document.documentElement.setAttribute("data-vizel-theme", "light");
    await render(<Vizel initialMarkdown={SAMPLE_MARKDOWN} showToolbar autofocus={false} />);
    const root = await resolveVizelRoot();
    suppressCaret();
    await expect(root).toMatchScreenshot("editor-light", SCREENSHOT_OPTIONS);
  });

  test("dark theme renders the sample document with default chrome", async () => {
    document.documentElement.setAttribute("data-vizel-theme", "dark");
    await render(<Vizel initialMarkdown={SAMPLE_MARKDOWN} showToolbar autofocus={false} />);
    const root = await resolveVizelRoot();
    suppressCaret();
    await expect(root).toMatchScreenshot("editor-dark", SCREENSHOT_OPTIONS);
  });

  test("toolbar-only chrome (no bubble menu) light", async () => {
    document.documentElement.setAttribute("data-vizel-theme", "light");
    await render(
      <Vizel
        initialMarkdown={PLAIN_MARKDOWN}
        showToolbar
        showBubbleMenu={false}
        autofocus={false}
      />
    );
    const root = await resolveVizelRoot();
    suppressCaret();
    await expect(root).toMatchScreenshot("editor-toolbar-only-light", SCREENSHOT_OPTIONS);
  });
});
