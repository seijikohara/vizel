---
paths: packages/core/**/*.ts
---

# @vizel/core Package Guidelines

## Package Purpose

The core package is the single source of truth for all framework-agnostic code.
Framework packages (react/vue/svelte) only wrap and re-export from core.

### Must be in core

- All TypeScript types and interfaces
- All constants
- All Tiptap extensions
- All utility functions
- All CSS styles

### Must NOT be in core

- Framework-specific components
- Framework-specific state management (hooks/composables/runes)
- Framework runtime dependencies

## Extension Development

### Creating Extensions

- Use individual tiptap extension packages (not @tiptap/starter-kit)
- Configure extensions through `createVizelExtensions()`
- Export extensions for advanced usage

```typescript
import Heading from "@tiptap/extension-heading";

// Configure extension
Heading.configure({
  levels: [1, 2, 3],
});
```

### Extension Categories

| Category | Location | Description |
|----------|----------|-------------|
| Base | `extensions/base.ts` | Core text editing (Heading, Bold, Italic, etc.) |
| SlashCommand | `extensions/slash-command.ts` | Slash command menu |
| Table | `extensions/table.ts` | Table editing with row/column controls |
| Link | `extensions/link.ts` | Link with autolink and paste support |
| Image | `extensions/image.ts` | Image upload and resize |
| CodeBlock | `extensions/code-block-lowlight.ts` | Syntax-highlighted code blocks |
| CharacterCount | `extensions/character-count.ts` | Character and word counting |
| TextColor | `extensions/text-color.ts` | Text color and highlight |
| TaskList | `extensions/task-list.ts` | Checkbox task lists |
| DragHandle | `extensions/drag-handle.ts` | Block drag handle and keyboard reordering |
| Markdown | `extensions/markdown.ts` | Markdown import/export |
| Mathematics | `extensions/mathematics.ts` | LaTeX math with KaTeX |
| Embed | `extensions/embed.ts` | URL embedding (oEmbed/OGP) |
| Details | `extensions/details.ts` | Collapsible content blocks |
| Diagram | `extensions/diagram.ts` | Mermaid and GraphViz diagrams |
| WikiLink | `extensions/wiki-link.ts` | Wiki-style internal links |
| Comment | `extensions/comment.ts` | Text annotations and comments |

## Dependencies

### Allowed Dependencies

- @tiptap/* extension packages
- @tiptap/core
- @tiptap/pm
- @tiptap/suggestion

### Prohibited Dependencies

- Framework-specific packages (React, Vue, Svelte)
- @tiptap/starter-kit (use individual packages)
- Runtime-only dependencies

## Build Configuration

### vite.config.ts

- External all @tiptap/* packages
- Use ES module format
- Preserve module structure

```typescript
external: [
  "@tiptap/core",
  "@tiptap/extension-*",
  "@tiptap/pm",
  "@tiptap/suggestion",
],
```

## Exports

### Public API (index.ts)

- Export all extensions
- Export all types with `type` prefix
- Export utility functions
- Alphabetical ordering

### Naming Conventions

| Pattern | Example |
|---------|---------|
| Options type | `VizelExtensionsOptions`, `VizelImageOptions` |
| Create function | `createVizelExtensions()`, `createLinkExtension()` |
| Extension | `SlashCommand`, `ImageResize` |

## CSS Styles

Location: `src/styles/`

- Use BEM-like naming: `.vizel-*`
- Scope styles to Vizel components
- Use CSS custom properties for theming
- Document style dependencies in comments
