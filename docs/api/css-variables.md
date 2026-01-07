# CSS Variables Reference

Complete reference of all CSS custom properties available in Vizel.

## Color Variables

### Primary Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-primary` | `#3b82f6` | `#60a5fa` | Primary brand color |
| `--vizel-primary-hover` | `#2563eb` | `#93c5fd` | Primary hover state |
| `--vizel-primary-active` | `#1d4ed8` | `#bfdbfe` | Primary active state |
| `--vizel-primary-foreground` | `#ffffff` | `#0f172a` | Text on primary |
| `--vizel-primary-bg` | `rgba(59, 130, 246, 0.1)` | `rgba(96, 165, 250, 0.1)` | Primary background |
| `--vizel-primary-bg-hover` | `rgba(59, 130, 246, 0.15)` | `rgba(96, 165, 250, 0.15)` | Primary bg hover |

### Secondary Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-secondary` | `#64748b` | `#94a3b8` | Secondary color |
| `--vizel-secondary-hover` | `#475569` | `#cbd5e1` | Secondary hover |
| `--vizel-secondary-foreground` | `#ffffff` | `#0f172a` | Text on secondary |

### Background & Foreground

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-background` | `#ffffff` | `#0f172a` | Main background |
| `--vizel-background-secondary` | `#f8fafc` | `#1e293b` | Secondary background |
| `--vizel-background-tertiary` | `#f1f5f9` | `#334155` | Tertiary background |
| `--vizel-foreground` | `#0f172a` | `#f8fafc` | Main text color |
| `--vizel-foreground-secondary` | `#334155` | `#cbd5e1` | Secondary text |
| `--vizel-foreground-muted` | `#64748b` | `#94a3b8` | Muted text |

### UI Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-muted` | `#f1f5f9` | `#1e293b` | Muted background |
| `--vizel-muted-foreground` | `#64748b` | `#94a3b8` | Muted foreground |
| `--vizel-accent` | `#f1f5f9` | `#1e293b` | Accent background |
| `--vizel-accent-foreground` | `#0f172a` | `#f8fafc` | Accent foreground |
| `--vizel-border` | `#e2e8f0` | `#334155` | Border color |
| `--vizel-border-hover` | `#cbd5e1` | `#475569` | Border hover |

### State Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-hover-bg` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.05)` | Hover background |
| `--vizel-active-bg` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.1)` | Active background |
| `--vizel-success` | `#22c55e` | `#4ade80` | Success color |
| `--vizel-warning` | `#f59e0b` | `#fbbf24` | Warning color |
| `--vizel-error` | `#ef4444` | `#f87171` | Error color |
| `--vizel-destructive` | `#ef4444` | `#f87171` | Destructive actions |
| `--vizel-destructive-bg` | `rgba(239, 68, 68, 0.1)` | `rgba(248, 113, 113, 0.1)` | Destructive bg |
| `--vizel-destructive-border` | `rgba(239, 68, 68, 0.3)` | `rgba(248, 113, 113, 0.3)` | Destructive border |

---

## Typography Variables

### Font Families

| Variable | Default Value |
|----------|---------------|
| `--vizel-font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--vizel-font-serif` | `Georgia, Cambria, "Times New Roman", Times, serif` |
| `--vizel-font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

### Font Sizes

| Variable | Value | Pixels (16px base) |
|----------|-------|-------------------|
| `--vizel-font-size-xs` | `0.75rem` | 12px |
| `--vizel-font-size-sm` | `0.875rem` | 14px |
| `--vizel-font-size-base` | `1rem` | 16px |
| `--vizel-font-size-lg` | `1.125rem` | 18px |
| `--vizel-font-size-xl` | `1.25rem` | 20px |
| `--vizel-font-size-2xl` | `1.5rem` | 24px |
| `--vizel-font-size-3xl` | `1.875rem` | 30px |
| `--vizel-font-size-4xl` | `2.25rem` | 36px |

### Line Heights

| Variable | Value |
|----------|-------|
| `--vizel-line-height-tight` | `1.25` |
| `--vizel-line-height-snug` | `1.375` |
| `--vizel-line-height-normal` | `1.5` |
| `--vizel-line-height-relaxed` | `1.625` |
| `--vizel-line-height-loose` | `2` |

### Font Weights

| Variable | Value |
|----------|-------|
| `--vizel-font-weight-normal` | `400` |
| `--vizel-font-weight-medium` | `500` |
| `--vizel-font-weight-semibold` | `600` |
| `--vizel-font-weight-bold` | `700` |

---

## Spacing Variables

| Variable | Value | Pixels (16px base) |
|----------|-------|-------------------|
| `--vizel-spacing-0` | `0` | 0px |
| `--vizel-spacing-1` | `0.25rem` | 4px |
| `--vizel-spacing-2` | `0.5rem` | 8px |
| `--vizel-spacing-3` | `0.75rem` | 12px |
| `--vizel-spacing-4` | `1rem` | 16px |
| `--vizel-spacing-5` | `1.25rem` | 20px |
| `--vizel-spacing-6` | `1.5rem` | 24px |
| `--vizel-spacing-8` | `2rem` | 32px |
| `--vizel-spacing-10` | `2.5rem` | 40px |
| `--vizel-spacing-12` | `3rem` | 48px |

---

## Border Radius Variables

| Variable | Value | Pixels |
|----------|-------|--------|
| `--vizel-radius-none` | `0` | 0px |
| `--vizel-radius-sm` | `0.25rem` | 4px |
| `--vizel-radius-md` | `0.375rem` | 6px |
| `--vizel-radius-lg` | `0.5rem` | 8px |
| `--vizel-radius-xl` | `0.75rem` | 12px |
| `--vizel-radius-2xl` | `1rem` | 16px |
| `--vizel-radius-full` | `9999px` | Circular |

---

## Shadow Variables

| Variable | Value |
|----------|-------|
| `--vizel-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `--vizel-shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| `--vizel-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| `--vizel-shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` |
| `--vizel-shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` |

---

## Transition Variables

| Variable | Value |
|----------|-------|
| `--vizel-transition-fast` | `100ms` |
| `--vizel-transition-normal` | `150ms` |
| `--vizel-transition-slow` | `300ms` |

---

## Z-Index Variables

| Variable | Value | Use Case |
|----------|-------|----------|
| `--vizel-z-dropdown` | `50` | Dropdown menus |
| `--vizel-z-sticky` | `60` | Sticky headers |
| `--vizel-z-fixed` | `70` | Fixed elements |
| `--vizel-z-modal-backdrop` | `80` | Modal backdrops |
| `--vizel-z-modal` | `90` | Modals |
| `--vizel-z-popover` | `100` | Popovers, tooltips |
| `--vizel-z-tooltip` | `110` | Tooltips (highest) |

---

## Editor Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-editor-min-height` | `350px` | Minimum editor height |
| `--vizel-editor-padding` | `var(--vizel-spacing-6)` | Editor content padding |
| `--vizel-editor-font-family` | `var(--vizel-font-sans)` | Editor font family |
| `--vizel-editor-font-size` | `var(--vizel-font-size-base)` | Editor font size |
| `--vizel-editor-line-height` | `var(--vizel-line-height-relaxed)` | Editor line height |

---

## Image Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-image-border-radius` | `var(--vizel-radius-lg)` | Image border radius |
| `--vizel-image-outline-color` | `var(--vizel-primary)` | Selected image outline |
| `--vizel-image-outline-width` | `2px` | Outline width |
| `--vizel-resize-handle-color` | `var(--vizel-primary)` | Resize handle color |
| `--vizel-resize-handle-width` | `8px` | Handle width |
| `--vizel-resize-handle-height` | `48px` | Handle height |

---

## Code Block Variables

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
| `--vizel-code-block-input-bg` | Input background |
| `--vizel-code-block-input-border` | Input border |

---

## Mathematics Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-math-block-bg` | `var(--vizel-background-secondary)` | Block math background |
| `--vizel-math-inline-bg` | `transparent` | Inline math background |

---

## Portal Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-portal-base-z-index` | `9999` | Base z-index for portal elements |

---

## Theme Selectors

CSS selectors that trigger theme changes:

```css
/* Light theme (default) */
:root,
.light,
[data-theme="light"],
[data-vizel-theme="light"] {
  /* Light theme variables */
}

/* Dark theme */
.dark,
[data-theme="dark"],
[data-vizel-theme="dark"] {
  /* Dark theme variables */
}
```

---

## Usage Example

```css
/* Custom theme overrides */
:root {
  /* Custom primary color */
  --vizel-primary: #8b5cf6;
  --vizel-primary-hover: #7c3aed;
  --vizel-primary-active: #6d28d9;
  
  /* Custom border radius */
  --vizel-radius-md: 8px;
  --vizel-radius-lg: 12px;
  
  /* Custom editor settings */
  --vizel-editor-min-height: 500px;
  --vizel-editor-padding: 2rem;
}

[data-vizel-theme="dark"] {
  --vizel-primary: #a78bfa;
  --vizel-primary-hover: #c4b5fd;
}
```
