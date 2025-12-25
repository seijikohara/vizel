---
paths: "**/*.{ts,tsx,js,jsx,vue,svelte}"
---

# Code Style Guidelines

Code formatting, imports, exports, and naming are enforced by Biome.
Run `bun run check` to auto-fix. This document covers guidelines Biome doesn't enforce.

## Language

- Use English for all code, comments, and documentation
- Use technical, accurate, and formal language
- Avoid subjective or casual expressions

## TypeScript

### Type Definitions

- Prefer explicit type annotations for function parameters and return types
- Use `interface` for object shapes, `type` for unions and intersections
- Export types that are part of the public API with `type` prefix

### File Structure

- One component/function per file
- Co-locate related files (component + types + styles)
- Use index.ts for public API exports

## Documentation

- Add JSDoc for public API functions and types
- Include `@example` for complex usage
- Prefer self-documenting code over comments

## Function Declaration Style

### Use `function` Declarations For

- Exported functions (public API)
- Top-level functions
- Component definitions
- Hooks / Composables / Runes

```typescript
export function createEditor(options: EditorOptions): Editor { }
export function useVizelEditor(options: Options): Editor | null { }
```

### Use Arrow Functions For

- Callbacks (event handlers, promises)
- Array methods (map, filter, reduce)
- Type guard functions

```typescript
editor.on("update", ({ editor }) => { });
const filtered = items.filter((item) => item.active);
const isItem = (v: unknown): v is Item =>
  typeof v === "object" && v !== null && "id" in v;
```

## Type Safety

### Use `satisfies` Operator

Use `satisfies` to type-check values while preserving inferred types.

```typescript
// GOOD: preserves literal types
export const defaults = {
  enabled: true,
  minWidth: 100,
} satisfies Options;

// AVOID: loses literal type inference
export const defaults: Options = { };
```

### Use Type Guards Instead of `as` Casts

Replace `as` assertions with type guard functions for runtime safety.

```typescript
// AVOID: unsafe cast
const action = data as Action | undefined;

// GOOD: runtime validation
const isAction = (v: unknown): v is Action =>
  typeof v === "object" && v !== null && "type" in v;

if (isAction(data)) {
  data.type; // safely narrowed
}
```
