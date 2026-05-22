import { expect, test } from "@playwright/experimental-ct-react";
import { Vizel } from "@vizel/react";

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

test.describe("VizelEditor — visual regression", () => {
  test("light theme renders the sample document with default chrome", async ({ mount, page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-vizel-theme", "light");
    });
    const component = await mount(
      <Vizel initialMarkdown={SAMPLE_MARKDOWN} showToolbar autofocus={false} />
    );
    // Wait for the editor view to mount.
    await expect(component.locator(".ProseMirror")).toBeVisible();
    // Disable caret blink so snapshots are deterministic.
    await page.addStyleTag({ content: ".ProseMirror { caret-color: transparent !important; }" });
    await expect(component).toHaveScreenshot("editor-light.png");
  });

  test("dark theme renders the sample document with default chrome", async ({ mount, page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-vizel-theme", "dark");
    });
    const component = await mount(
      <Vizel initialMarkdown={SAMPLE_MARKDOWN} showToolbar autofocus={false} />
    );
    await expect(component.locator(".ProseMirror")).toBeVisible();
    await page.addStyleTag({ content: ".ProseMirror { caret-color: transparent !important; }" });
    await expect(component).toHaveScreenshot("editor-dark.png");
  });

  test("toolbar-only chrome (no bubble menu) light", async ({ mount, page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-vizel-theme", "light");
    });
    const component = await mount(
      <Vizel
        initialMarkdown="# Plain heading\n\nA single paragraph."
        showToolbar
        showBubbleMenu={false}
        autofocus={false}
      />
    );
    await expect(component.locator(".ProseMirror")).toBeVisible();
    await page.addStyleTag({ content: ".ProseMirror { caret-color: transparent !important; }" });
    await expect(component).toHaveScreenshot("editor-toolbar-only-light.png");
  });
});
