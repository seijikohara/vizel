# Spacing & Layout Variables

Spacing scale, border radius, shadows, transitions, and z-index.

## Spacing

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

## Border Radius

| Variable | Value | Pixels |
|----------|-------|--------|
| `--vizel-radius-none` | `0` | 0px |
| `--vizel-radius-sm` | `0.25rem` | 4px |
| `--vizel-radius-md` | `0.375rem` | 6px |
| `--vizel-radius-lg` | `0.5rem` | 8px |
| `--vizel-radius-xl` | `0.75rem` | 12px |
| `--vizel-radius-2xl` | `1rem` | 16px |
| `--vizel-radius-full` | `9999px` | Circular |

## Shadows

| Variable | Light | Dark |
|----------|-------|------|
| `--vizel-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | `0 1px 2px 0 rgb(0 0 0 / 0.3)` |
| `--vizel-shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)` |
| `--vizel-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | `0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)` |
| `--vizel-shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | `0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.4)` |
| `--vizel-shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | `0 25px 50px -12px rgb(0 0 0 / 0.5)` |

## Transitions

| Variable | Value |
|----------|-------|
| `--vizel-transition-fast` | `100ms` |
| `--vizel-transition-normal` | `150ms` |
| `--vizel-transition-slow` | `300ms` |

## Z-Index

| Variable | Value | Use Case |
|----------|-------|----------|
| `--vizel-z-dropdown` | `50` | Dropdown menus |
| `--vizel-z-sticky` | `60` | Sticky headers |
| `--vizel-z-fixed` | `70` | Fixed elements |
| `--vizel-z-modal-backdrop` | `80` | Modal backdrops |
| `--vizel-z-modal` | `90` | Modals |
| `--vizel-z-popover` | `100` | Popovers, tooltips |
| `--vizel-z-tooltip` | `110` | Tooltips (highest) |

## Portal Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--vizel-portal-base-z-index` | `9999` | Base z-index for portal elements |

## Usage Example

```css
:root {
  /* Larger border radius for a softer look */
  --vizel-radius-md: 8px;
  --vizel-radius-lg: 12px;
  
  /* Slower transitions */
  --vizel-transition-normal: 200ms;
  
  /* Custom z-index for specific use case */
  --vizel-portal-base-z-index: 10000;
}
```
