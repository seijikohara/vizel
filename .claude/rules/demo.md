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

Each demo includes initial content from `apps/demo/shared/demo-content.md` demonstrating:

- Heading levels and text formatting (bold, italic, code, strikethrough)
- Links, lists (bullet, numbered, task), and blockquotes
- Tables with column alignment
- Code blocks with syntax highlighting
- Mathematics (LaTeX inline and block)
- Diagrams (Mermaid)
- Embeds (YouTube, etc.)
- Collapsible details blocks
- Wiki links
- Image upload and resize

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
| Feature Toggles | Toolbar, Theme, Auto-save, Stats, Sync Panel |
| Editor container | Editor with BubbleMenu and optional Toolbar |
| Output Panel | Tabbed panel with Markdown and JSON output |
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
