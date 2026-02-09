# Component Variables

CSS variables for the editor, images, mathematics, and other components.

## Editor

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-editor-min-height` | `350px` | Minimum editor height |
| `--vizel-editor-padding` | `var(--vizel-spacing-6)` | Editor content padding |
| `--vizel-editor-font-family` | `var(--vizel-font-sans)` | Editor font family |
| `--vizel-editor-font-size` | `var(--vizel-font-size-base)` | Editor font size |
| `--vizel-editor-line-height` | `var(--vizel-line-height-relaxed)` | Editor line height |

## Image

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-image-border-radius` | `var(--vizel-radius-lg)` | Image border radius |
| `--vizel-image-outline-color` | `var(--vizel-primary)` | Selected image outline |
| `--vizel-image-outline-width` | `2px` | Outline width |

## Image Resize Handle

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-resize-handle-color` | `var(--vizel-primary)` | Resize handle color |
| `--vizel-resize-handle-color-hover` | `var(--vizel-primary-hover)` | Resize handle hover |
| `--vizel-resize-handle-width` | `8px` | Handle width |
| `--vizel-resize-handle-height` | `48px` | Handle height |
| `--vizel-resize-tooltip-bg` | `var(--vizel-foreground)` | Tooltip background |
| `--vizel-resize-tooltip-color` | `var(--vizel-background)` | Tooltip text |

## Mathematics

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-math-block-bg` | `var(--vizel-background-secondary)` | Block math background |
| `--vizel-math-block-hover-bg` | `var(--vizel-background-tertiary)` | Block math hover |
| `--vizel-math-block-selected-bg` | `var(--vizel-primary-bg)` | Block math selected |
| `--vizel-math-inline-bg` | `transparent` | Inline math background |
| `--vizel-math-inline-hover-bg` | `var(--vizel-background-secondary)` | Inline math hover |
| `--vizel-math-inline-selected-bg` | `var(--vizel-primary-bg)` | Inline math selected |
| `--vizel-math-editing-bg` | `var(--vizel-background-tertiary)` | Editing state bg |
| `--vizel-math-preview-bg` | `var(--vizel-background-secondary)` | Preview background |

## Code Block

See [Color Variables](./colors#code-block-colors) for code block color tokens.

| Variable | Description |
|----------|-------------|
| `--vizel-code-block-bg` | Background color |
| `--vizel-code-block-text` | Text color |
| `--vizel-code-block-border` | Border color |
| `--vizel-code-block-toolbar-bg` | Toolbar background |
| `--vizel-code-block-gutter-bg` | Line number gutter |
| `--vizel-code-block-line-number-color` | Line numbers |
| `--vizel-code-block-language-color` | Language indicator |
| `--vizel-code-block-placeholder` | Placeholder text |
| `--vizel-code-block-button-color` | Button text |
| `--vizel-code-block-button-border` | Button border |
| `--vizel-code-block-button-hover-bg` | Button hover bg |
| `--vizel-code-block-button-hover-color` | Button hover text |
| `--vizel-code-block-input-bg` | Input background |
| `--vizel-code-block-input-border` | Input border |
| `--vizel-code-block-input-focus-bg` | Input focus bg |

## Usage Example

```css
:root {
  /* Larger editor */
  --vizel-editor-min-height: 500px;
  --vizel-editor-padding: 2rem;
  
  /* Rounded images */
  --vizel-image-border-radius: 1rem;
  
  /* Custom math styling */
  --vizel-math-block-bg: oklch(0.95 0.01 250);
}
```
