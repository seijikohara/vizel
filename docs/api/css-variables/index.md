# CSS Variables Reference

Reference of CSS custom properties available in Vizel. Color values use the OKLCH color space for perceptual uniformity and wider gamut support.

## Overview

Vizel provides CSS custom properties for theming. Variables are organized into the following categories:

| Category | Description |
|----------|-------------|
| [Colors](./colors) | Primary, secondary, background, foreground, and state colors |
| [Typography](./typography) | Font families, sizes, weights, and line heights |
| [Spacing & Layout](./spacing) | Spacing scale, border radius, shadows, and z-index |
| [Components](./components) | Editor, image, code block, and math-specific variables |
| [Integrations](./integrations) | Tailwind CSS and shadcn/ui integration guides |

## Why OKLCH?

Vizel uses the [OKLCH color space](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) for all color values because:

1. **Perceptual uniformity** - Colors with the same lightness value appear equally bright
2. **Predictable manipulation** - Adjusting hue, chroma, or lightness produces predictable results
3. **Wider gamut** - Access to colors beyond sRGB on supported displays
4. **Dark mode** - Easier to create accessible color variations

OKLCH is supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 15.4+).

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

## Quick Example

```css
/* Custom theme overrides using OKLCH */
:root {
  /* Custom primary color (purple) */
  --vizel-primary: oklch(0.627 0.265 303.9);
  --vizel-primary-hover: oklch(0.558 0.288 302.321);
  
  /* Custom border radius */
  --vizel-radius-md: 8px;
  --vizel-radius-lg: 12px;
  
  /* Custom editor settings */
  --vizel-editor-min-height: 500px;
}

[data-vizel-theme="dark"] {
  --vizel-primary: oklch(0.714 0.203 305.504);
}
```

## Next Steps

- [Color Variables](./colors) - All color tokens with light/dark values
- [Typography Variables](./typography) - Font families, sizes, and weights
- [Spacing & Layout](./spacing) - Spacing, radius, shadows, and z-index
- [Component Variables](./components) - Editor and component-specific tokens
- [Integrations](./integrations) - Tailwind CSS and shadcn/ui setup
