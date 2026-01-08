# Typography Variables

Font families, sizes, weights, line heights, and letter spacing.

## Font Families

| Variable | Default Value |
|----------|---------------|
| `--vizel-font-sans` | `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--vizel-font-serif` | `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif` |
| `--vizel-font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` |

## Font Sizes

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

## Line Heights

| Variable | Value |
|----------|-------|
| `--vizel-line-height-tight` | `1.25` |
| `--vizel-line-height-snug` | `1.375` |
| `--vizel-line-height-normal` | `1.5` |
| `--vizel-line-height-relaxed` | `1.625` |
| `--vizel-line-height-loose` | `2` |

## Font Weights

| Variable | Value |
|----------|-------|
| `--vizel-font-weight-normal` | `400` |
| `--vizel-font-weight-medium` | `500` |
| `--vizel-font-weight-semibold` | `600` |
| `--vizel-font-weight-bold` | `700` |

## Letter Spacing

| Variable | Value |
|----------|-------|
| `--vizel-letter-spacing-tight` | `-0.025em` |
| `--vizel-letter-spacing-normal` | `0` |
| `--vizel-letter-spacing-wide` | `0.025em` |

## Usage Example

```css
:root {
  /* Use a custom font stack */
  --vizel-font-sans: "Inter", system-ui, sans-serif;
  
  /* Increase base font size */
  --vizel-font-size-base: 1.125rem;
  
  /* Use tighter line height */
  --vizel-line-height-relaxed: 1.5;
}
```
