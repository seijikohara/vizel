---
paths: packages/core/**/*.ts
---

# @vizel/core Package Guidelines

## Package Purpose

The core package is framework-agnostic and contains:

- Tiptap extension configurations
- Editor utilities and helpers
- Type definitions shared across frameworks

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
| Base | `extensions/starter-kit.ts` | Core text editing (Heading, Bold, etc.) |
| Image | `extensions/image.ts` | Image upload and resize |
| Link | `extensions/link.ts` | Link handling |
| Table | `extensions/table.ts` | Table support |
| SlashCommand | `extensions/slash-command.ts` | Slash menu |

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
