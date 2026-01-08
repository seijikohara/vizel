# Color Variables

All color values use the OKLCH color space for better perceptual uniformity.

## Primary Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-primary` | `oklch(0.623 0.214 259.815)` | `oklch(0.707 0.165 254.624)` | Primary brand color |
| `--vizel-primary-hover` | `oklch(0.546 0.245 262.881)` | `oklch(0.623 0.214 259.815)` | Primary hover state |
| `--vizel-primary-active` | `oklch(0.488 0.243 264.376)` | `oklch(0.546 0.245 262.881)` | Primary active state |
| `--vizel-primary-foreground` | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | Text on primary |
| `--vizel-primary-bg` | `oklch(0.623 0.214 259.815 / 0.1)` | `oklch(0.707 0.165 254.624 / 0.15)` | Primary background |
| `--vizel-primary-bg-hover` | `oklch(0.623 0.214 259.815 / 0.15)` | `oklch(0.707 0.165 254.624 / 0.2)` | Primary bg hover |

## Secondary Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-secondary` | `oklch(0.554 0.046 257.417)` | `oklch(0.704 0.04 256.788)` | Secondary color |
| `--vizel-secondary-hover` | `oklch(0.446 0.043 257.281)` | `oklch(0.869 0.022 252.894)` | Secondary hover |
| `--vizel-secondary-foreground` | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | Text on secondary |

## Background & Foreground

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-background` | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | Main background |
| `--vizel-background-secondary` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | Secondary background |
| `--vizel-background-tertiary` | `oklch(0.967 0 0)` | `oklch(0.279 0.041 260.031)` | Tertiary background |
| `--vizel-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` | Main text color |
| `--vizel-foreground-secondary` | `oklch(0.556 0 0)` | `oklch(0.869 0.022 252.894)` | Secondary text |
| `--vizel-foreground-muted` | `oklch(0.708 0 0)` | `oklch(0.708 0 0)` | Muted text |

## UI Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-muted` | `oklch(0.967 0 0)` | `oklch(0.279 0.041 260.031)` | Muted background |
| `--vizel-muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Muted foreground |
| `--vizel-accent` | `oklch(0.967 0 0)` | `oklch(0.279 0.041 260.031)` | Accent background |
| `--vizel-accent-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` | Accent foreground |
| `--vizel-border` | `oklch(0.922 0 0)` | `oklch(0.279 0.041 260.031)` | Border color |
| `--vizel-border-hover` | `oklch(0.869 0.005 56.366)` | `oklch(0.372 0.044 257.287)` | Border hover |

## State Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-hover-bg` | `oklch(0 0 0 / 0.05)` | `oklch(1 0 0 / 0.05)` | Hover background |
| `--vizel-active-bg` | `oklch(0 0 0 / 0.1)` | `oklch(1 0 0 / 0.1)` | Active background |

## Status Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-success` | `oklch(0.723 0.219 149.579)` | `oklch(0.696 0.17 162.48)` | Success color |
| `--vizel-success-foreground` | `oklch(1 0 0)` | `oklch(1 0 0)` | Success foreground |
| `--vizel-warning` | `oklch(0.769 0.188 70.08)` | `oklch(0.828 0.189 84.429)` | Warning color |
| `--vizel-warning-foreground` | `oklch(1 0 0)` | `oklch(1 0 0)` | Warning foreground |
| `--vizel-error` | `oklch(0.637 0.237 25.331)` | `oklch(0.704 0.191 22.216)` | Error color |
| `--vizel-error-foreground` | `oklch(1 0 0)` | `oklch(1 0 0)` | Error foreground |

## Destructive Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Destructive actions |
| `--vizel-destructive-foreground` | `oklch(1 0 0)` | `oklch(1 0 0)` | Destructive foreground |
| `--vizel-destructive-bg` | `oklch(0.577 0.245 27.325 / 0.1)` | `oklch(0.704 0.191 22.216 / 0.15)` | Destructive bg |
| `--vizel-destructive-border` | `oklch(0.885 0.062 18.334)` | `oklch(0.396 0.141 25.723)` | Destructive border |

## Code Block Colors

| Variable | Light | Dark | Description |
|----------|-------|------|-------------|
| `--vizel-code-block-bg` | `oklch(0.205 0 0)` | `oklch(0.205 0 0)` | Background color |
| `--vizel-code-block-text` | `oklch(0.869 0.005 56.366)` | `oklch(0.869 0.005 56.366)` | Text color |
| `--vizel-code-block-toolbar-bg` | `oklch(0.269 0 0)` | `oklch(0.216 0.006 56.043)` | Toolbar background |
| `--vizel-code-block-gutter-bg` | `oklch(0.216 0.006 56.043)` | `oklch(0.205 0 0)` | Line number gutter |
| `--vizel-code-block-line-number-color` | `oklch(0.553 0.013 58.071)` | `oklch(0.553 0.013 58.071)` | Line numbers |
| `--vizel-code-block-language-color` | `oklch(0.828 0.111 230.318)` | `oklch(0.828 0.111 230.318)` | Language indicator |
| `--vizel-code-block-placeholder` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` | Placeholder text |
| `--vizel-code-block-button-color` | `oklch(0.869 0 0)` | `oklch(0.869 0 0)` | Button text |
| `--vizel-code-block-button-border` | `oklch(0.371 0 0)` | `oklch(0.371 0 0)` | Button border |
| `--vizel-code-block-button-hover-bg` | `oklch(0.371 0 0)` | `oklch(0.371 0 0)` | Button hover bg |
| `--vizel-code-block-button-hover-color` | `oklch(1 0 0)` | `oklch(1 0 0)` | Button hover text |
| `--vizel-code-block-input-bg` | `oklch(0.371 0 0)` | `oklch(0.371 0 0)` | Input background |
| `--vizel-code-block-input-border` | `oklch(0.371 0 0)` | `oklch(0.371 0 0)` | Input border |
| `--vizel-code-block-input-focus-bg` | `oklch(0.205 0 0)` | `oklch(0.205 0 0)` | Input focus bg |
