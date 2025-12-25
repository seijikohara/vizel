---
paths: apps/demo/**/*
---

# Demo Applications Guidelines

## Purpose

Demo applications showcase Vizel editor features:

- Visual testing of components
- Example usage patterns
- Development and debugging

## Structure

```
apps/demo/
├── react/    # React 19 demo
├── vue/      # Vue 3 demo
└── svelte/   # Svelte 5 demo
```

## Content Guidelines

### Language

- Use English for all UI text
- Use technical, formal descriptions
- Avoid product name references

### Initial Content

Each demo includes initial content demonstrating:

- Heading levels
- Text formatting (bold, italic, code)
- Links
- Lists (bullet, numbered)
- Blockquotes
- Feature descriptions

## Consistency Across Frameworks

All three demos must maintain:

- Same visual appearance (shared CSS)
- Same initial content structure
- Same feature set demonstration
- Same UI component layout

### Shared Elements

| Element | Description |
|---------|-------------|
| Header | Framework logo, title, badge |
| Features bar | Slash Commands, Bubble Menu, Tables, Links, Image Upload |
| Editor container | Editor with BubbleMenu |
| JSON Output | Collapsible JSON viewer |
| Footer | Built with @vizel/* |

## Dependencies

### Allowed

- Vizel packages (@vizel/react, @vizel/vue, @vizel/svelte)
- Vite (development server)
- Framework-specific dev dependencies

### Prohibited

- Additional UI libraries
- State management libraries
- Routing libraries

## CSS

- Import from `packages/core/src/styles/index.css`
- Use shared styles.css for demo-specific styling
- Maintain consistent look across frameworks

## Testing Changes

When modifying packages, test in all three demo apps. Verify:

- Feature works correctly
- No browser console errors
- Keyboard navigation
- Slash commands
- Bubble menu
