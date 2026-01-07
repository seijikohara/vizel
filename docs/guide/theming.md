# Theming

Vizel provides a comprehensive theming system using CSS variables. You can customize colors, typography, spacing, and more.

## Importing Styles

### Default Styles

Import the complete stylesheet (recommended for most projects):

```typescript
import '@vizel/core/styles.css';
```

This includes:
- CSS variable definitions (light and dark themes)
- Component styles
- Typography styles

### Components Only (shadcn/ui)

For projects using shadcn/ui or custom CSS variables:

```typescript
import '@vizel/core/components.css';
```

This includes only component styles without CSS variable definitions.

---

## Theme Provider

Use the `ThemeProvider` to enable dark mode support:

::: code-group

```tsx [React]
import { ThemeProvider } from '@vizel/react';

function App() {
  return (
    <ThemeProvider 
      defaultTheme="system" 
      storageKey="my-app-theme"
    >
      <Editor />
    </ThemeProvider>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { ThemeProvider } from '@vizel/vue';
</script>

<template>
  <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
    <Editor />
  </ThemeProvider>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { ThemeProvider } from '@vizel/svelte';
</script>

<ThemeProvider defaultTheme="system" storageKey="my-app-theme">
  <Editor />
</ThemeProvider>
```

:::

### ThemeProvider Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Default theme |
| `storageKey` | `string` | `"vizel-theme"` | localStorage key for persistence |
| `targetSelector` | `string` | `document.documentElement` | Element to apply theme attribute |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions during theme change |

### Using Theme State

::: code-group

```tsx [React]
import { useTheme } from '@vizel/react';

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { useTheme } from '@vizel/vue';

const { theme, resolvedTheme, setTheme } = useTheme();
</script>

<template>
  <select :value="theme" @change="setTheme($event.target.value)">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="system">System</option>
  </select>
</template>
```

```svelte [Svelte]
<script lang="ts">
  import { getTheme } from '@vizel/svelte';
  
  const theme = getTheme();
</script>

<select value={theme.theme} onchange={(e) => theme.setTheme(e.target.value)}>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="system">System</option>
</select>
```

:::

### Theme State Properties

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `"light" \| "dark" \| "system"` | Current theme setting |
| `resolvedTheme` | `"light" \| "dark"` | Actual resolved theme |
| `systemTheme` | `"light" \| "dark"` | System preference |
| `setTheme` | `(theme) => void` | Function to change theme |

---

## CSS Variables

Vizel uses CSS custom properties (variables) for all visual styling. Override these to customize the appearance.

### Theme Selectors

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

### Color Variables

#### Primary Colors

| Variable | Description |
|----------|-------------|
| `--vizel-primary` | Primary brand color |
| `--vizel-primary-hover` | Primary hover state |
| `--vizel-primary-active` | Primary active state |
| `--vizel-primary-foreground` | Text on primary background |
| `--vizel-primary-bg` | Primary background (10% opacity) |
| `--vizel-primary-bg-hover` | Primary background hover |

#### Secondary Colors

| Variable | Description |
|----------|-------------|
| `--vizel-secondary` | Secondary color |
| `--vizel-secondary-hover` | Secondary hover state |
| `--vizel-secondary-foreground` | Text on secondary background |

#### Background & Foreground

| Variable | Description |
|----------|-------------|
| `--vizel-background` | Main background |
| `--vizel-background-secondary` | Secondary background |
| `--vizel-background-tertiary` | Tertiary background |
| `--vizel-foreground` | Main text color |
| `--vizel-foreground-secondary` | Secondary text color |
| `--vizel-foreground-muted` | Muted text color |

#### UI Colors

| Variable | Description |
|----------|-------------|
| `--vizel-muted` | Muted background |
| `--vizel-muted-foreground` | Muted foreground |
| `--vizel-accent` | Accent background |
| `--vizel-accent-foreground` | Accent foreground |
| `--vizel-border` | Border color |
| `--vizel-border-hover` | Border hover color |

#### State Colors

| Variable | Description |
|----------|-------------|
| `--vizel-hover-bg` | Hover background |
| `--vizel-active-bg` | Active background |
| `--vizel-success` | Success color |
| `--vizel-warning` | Warning color |
| `--vizel-error` | Error color |
| `--vizel-destructive` | Destructive action color |

### Example: Custom Colors

```css
:root {
  /* Brand colors */
  --vizel-primary: #6366f1;
  --vizel-primary-hover: #4f46e5;
  --vizel-primary-active: #4338ca;
  --vizel-primary-foreground: #ffffff;
  
  /* Background */
  --vizel-background: #ffffff;
  --vizel-background-secondary: #f8fafc;
  --vizel-foreground: #0f172a;
  
  /* Borders */
  --vizel-border: #e2e8f0;
}

[data-vizel-theme="dark"] {
  --vizel-primary: #818cf8;
  --vizel-primary-hover: #a5b4fc;
  
  --vizel-background: #0f172a;
  --vizel-background-secondary: #1e293b;
  --vizel-foreground: #f8fafc;
  
  --vizel-border: #334155;
}
```

---

## Typography Variables

### Font Families

| Variable | Default |
|----------|---------|
| `--vizel-font-sans` | `system-ui, -apple-system, sans-serif` |
| `--vizel-font-serif` | `Georgia, serif` |
| `--vizel-font-mono` | `ui-monospace, monospace` |

### Font Sizes

| Variable | Value |
|----------|-------|
| `--vizel-font-size-xs` | `0.75rem` |
| `--vizel-font-size-sm` | `0.875rem` |
| `--vizel-font-size-base` | `1rem` |
| `--vizel-font-size-lg` | `1.125rem` |
| `--vizel-font-size-xl` | `1.25rem` |
| `--vizel-font-size-2xl` | `1.5rem` |
| `--vizel-font-size-3xl` | `1.875rem` |
| `--vizel-font-size-4xl` | `2.25rem` |

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

| Variable | Value |
|----------|-------|
| `--vizel-spacing-0` | `0` |
| `--vizel-spacing-1` | `0.25rem` |
| `--vizel-spacing-2` | `0.5rem` |
| `--vizel-spacing-3` | `0.75rem` |
| `--vizel-spacing-4` | `1rem` |
| `--vizel-spacing-5` | `1.25rem` |
| `--vizel-spacing-6` | `1.5rem` |
| `--vizel-spacing-8` | `2rem` |
| `--vizel-spacing-10` | `2.5rem` |
| `--vizel-spacing-12` | `3rem` |

---

## Border Radius Variables

| Variable | Value |
|----------|-------|
| `--vizel-radius-none` | `0` |
| `--vizel-radius-sm` | `0.25rem` |
| `--vizel-radius-md` | `0.375rem` |
| `--vizel-radius-lg` | `0.5rem` |
| `--vizel-radius-xl` | `0.75rem` |
| `--vizel-radius-2xl` | `1rem` |
| `--vizel-radius-full` | `9999px` |

---

## Shadow Variables

| Variable | Description |
|----------|-------------|
| `--vizel-shadow-sm` | Small shadow |
| `--vizel-shadow-md` | Medium shadow |
| `--vizel-shadow-lg` | Large shadow |
| `--vizel-shadow-xl` | Extra large shadow |
| `--vizel-shadow-2xl` | 2XL shadow |

---

## Transition Variables

| Variable | Value |
|----------|-------|
| `--vizel-transition-fast` | `100ms` |
| `--vizel-transition-normal` | `150ms` |
| `--vizel-transition-slow` | `300ms` |

---

## Z-Index Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `--vizel-z-dropdown` | `50` | Dropdowns |
| `--vizel-z-sticky` | `60` | Sticky elements |
| `--vizel-z-fixed` | `70` | Fixed elements |
| `--vizel-z-modal-backdrop` | `80` | Modal backdrop |
| `--vizel-z-modal` | `90` | Modals |
| `--vizel-z-popover` | `100` | Popovers |
| `--vizel-z-tooltip` | `110` | Tooltips |

---

## Component-Specific Variables

### Editor

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-editor-min-height` | `350px` | Minimum editor height |
| `--vizel-editor-padding` | `var(--vizel-spacing-6)` | Editor padding |
| `--vizel-editor-font-family` | `var(--vizel-font-sans)` | Editor font |
| `--vizel-editor-font-size` | `var(--vizel-font-size-base)` | Editor font size |
| `--vizel-editor-line-height` | `var(--vizel-line-height-relaxed)` | Editor line height |

### Images

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-image-border-radius` | `var(--vizel-radius-lg)` | Image border radius |
| `--vizel-image-outline-color` | `var(--vizel-primary)` | Selected image outline |
| `--vizel-image-outline-width` | `2px` | Outline width |
| `--vizel-resize-handle-color` | `var(--vizel-primary)` | Resize handle color |
| `--vizel-resize-handle-width` | `8px` | Resize handle width |
| `--vizel-resize-handle-height` | `48px` | Resize handle height |

### Code Blocks

| Variable | Description |
|----------|-------------|
| `--vizel-code-block-bg` | Background color |
| `--vizel-code-block-text` | Text color |
| `--vizel-code-block-toolbar-bg` | Toolbar background |
| `--vizel-code-block-gutter-bg` | Line number gutter background |
| `--vizel-code-block-line-number-color` | Line number color |
| `--vizel-code-block-language-color` | Language indicator color |
| `--vizel-code-block-placeholder` | Placeholder text color |
| `--vizel-code-block-button-color` | Button text color |
| `--vizel-code-block-button-border` | Button border color |
| `--vizel-code-block-button-hover-bg` | Button hover background |
| `--vizel-code-block-input-bg` | Input background |
| `--vizel-code-block-input-border` | Input border |

### Mathematics

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-math-block-bg` | `var(--vizel-background-secondary)` | Block math background |
| `--vizel-math-inline-bg` | `transparent` | Inline math background |

### Portal

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-portal-base-z-index` | `9999` | Base z-index for portals |

---

## shadcn/ui Integration

Map shadcn/ui CSS variables to Vizel:

```css
:root {
  /* Map shadcn colors to Vizel */
  --vizel-primary: hsl(var(--primary));
  --vizel-primary-foreground: hsl(var(--primary-foreground));
  --vizel-background: hsl(var(--background));
  --vizel-foreground: hsl(var(--foreground));
  --vizel-border: hsl(var(--border));
  --vizel-muted: hsl(var(--muted));
  --vizel-muted-foreground: hsl(var(--muted-foreground));
  --vizel-accent: hsl(var(--accent));
  --vizel-accent-foreground: hsl(var(--accent-foreground));
  --vizel-destructive: hsl(var(--destructive));
  
  /* Map radius */
  --vizel-radius-sm: calc(var(--radius) - 4px);
  --vizel-radius-md: calc(var(--radius) - 2px);
  --vizel-radius-lg: var(--radius);
}
```

---

## Preventing Flash of Unstyled Content

Add the theme init script to your HTML `<head>` to prevent flash:

```typescript
import { getThemeInitScript } from '@vizel/core';

// In your HTML head
const script = getThemeInitScript('my-theme-key');
// <script>{script}</script>
```

Or manually:

```html
<script>
  (function() {
    const stored = localStorage.getItem('my-theme-key');
    const theme = stored || 'system';
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-vizel-theme', resolved);
  })();
</script>
```

---

## Next Steps

- [CSS Variables Reference](/api/css-variables) - Complete variable list
- [Auto-Save](/guide/auto-save) - Persist content automatically
- [API Reference](/api/) - Complete API documentation
