---
paths: "**/*.{ts,tsx,js,jsx,vue,svelte}"
---

# Code Style Guidelines

## Language

- Use English for all code, comments, and documentation
- Use technical, accurate, and formal language
- Avoid subjective or casual expressions

## TypeScript

### Type Definitions

- Prefer explicit type annotations for function parameters and return types
- Use `interface` for object shapes, `type` for unions and intersections
- Export types that are part of the public API with `type` prefix

### Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Variables/Functions | camelCase | `createEditor`, `editorOptions` |
| Classes/Interfaces/Types | PascalCase | `Editor`, `EditorOptions` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PLACEHOLDER` |
| File names | kebab-case or camelCase | `editor-content.tsx`, `useVizelEditor.ts` |

### Exports

- Use named exports exclusively (no default exports)
- Sort exports alphabetically

## Code Organization

### Import Order

1. External packages (node_modules)
2. Internal absolute imports (@vizel/*)
3. Relative imports (./*)

### File Structure

- One component/function per file
- Co-locate related files (component + types + styles)
- Use index.ts for public API exports

## Documentation

- Add JSDoc for public API functions and types
- Include `@example` for complex usage
- Prefer self-documenting code over comments
