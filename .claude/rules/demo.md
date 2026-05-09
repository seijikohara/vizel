---
paths:
  - "apps/demo/**/*"
---

# Demo Applications

The demo applications under `apps/demo/` showcase Vizel features. They serve as visual tests, example usage, and a development sandbox.

## Structure

```
apps/demo/
├── react/    # React 19 demo
├── vue/      # Vue 3 demo
└── svelte/   # Svelte 5 demo
```

## Content Guidelines

### Language

- Write all UI text in English.
- Use technical, formal descriptions.
- Avoid product name references.

### Initial Content

Each demo loads `apps/demo/shared/demo-content.md`. The content demonstrates:

- Heading levels and text formatting (bold, italic, code, strikethrough).
- Links, lists (bullet, numbered, task), and blockquotes.
- Tables with column alignment.
- Code blocks with syntax highlighting.
- Mathematics (LaTeX inline and block).
- Diagrams (Mermaid).
- Embeds (YouTube and others).
- Collapsible details blocks.
- Wiki links.
- Image upload and resize.

## Cross-Framework Consistency

All three demos share:

- Visual appearance (shared CSS).
- Initial content structure.
- Feature set on display.
- UI component layout.

### Shared Elements

| Element | Description |
|---------|-------------|
| Header | Framework logo, title, badge |
| Feature toggles | Toolbar, theme, auto-save, stats, sync panel |
| Editor container | Editor with bubble menu and optional toolbar |
| Output panel | Tabbed panel for Markdown and JSON output |
| Footer | "Built with `@vizel/*`" |

## Dependencies

### Allowed

- Vizel packages (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`).
- Vite (development server).
- Framework-specific dev dependencies.

### Prohibited

- Additional UI libraries.
- State management libraries.
- Routing libraries.

## CSS

- Import `packages/core/src/styles/index.css` as the editor stylesheet.
- Use the shared `styles.css` for demo-specific styling.
- Maintain a consistent look across frameworks.

## Verification Checklist

When you modify any package, verify the change in all three demos:

- The feature works.
- The browser console contains no errors.
- Keyboard navigation still works.
- Slash commands still work.
- The bubble menu still works.
