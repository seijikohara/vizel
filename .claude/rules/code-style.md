---
paths:
  - "packages/**/*.{ts,tsx,vue,svelte}"
  - "apps/**/*.{ts,tsx,vue,svelte}"
  - "tests/**/*.{ts,tsx}"
---

# Code Style

Biome enforces formatting, import order, export style, and naming. Run `pnpm check` to auto-fix Biome violations. This document covers the guidelines that Biome does not enforce.

## Language

- Write all code, comments, and documentation in English.
- Use technical, accurate, and formal language.
- Avoid subjective or casual expressions.

## TypeScript

### Type Definitions

- Annotate function parameters and return types explicitly.
- Use `interface` for object shapes. Use `type` for unions and intersections.
- Export public API types with the `type` modifier (`export type`).

### File Structure

- Place one component or function per file.
- Co-locate related files (component, types, styles) in the same directory.
- Use `index.ts` for public API exports.

### Documentation

- Add JSDoc to public API functions and types.
- Include `@example` blocks for complex usage.
- Prefer self-documenting code over comments.

## Function Declaration Style

### Use `function` Declarations

Use `function` declarations for the following:

- Exported functions (public API)
- Top-level functions
- Component definitions
- Hooks, composables, and runes

```typescript
export function createEditor(options: EditorOptions): Editor {}
export function useVizelEditor(options: Options): Editor | null {}
```

### Use Arrow Functions

Use arrow functions for the following:

- Callbacks (event handlers, promise resolvers)
- Array methods (`map`, `filter`, `reduce`)
- Type guard functions

```typescript
editor.on("update", ({ editor }) => {});
const filtered = items.filter((item) => item.active);
const isItem = (v: unknown): v is Item =>
  typeof v === "object" && v !== null && "id" in v;
```

## Type Safety

### Prefer `satisfies` Over Type Annotations

Use `satisfies` to type-check a value while preserving its inferred literal types.

```typescript
// GOOD: preserves literal types.
export const defaults = {
  enabled: true,
  minWidth: 100,
} satisfies Options;

// AVOID: loses literal type inference.
export const defaults: Options = {};
```

### Prefer Type Guards Over `as` Casts

Replace `as` assertions with type guard functions to gain runtime safety.

```typescript
// AVOID: unsafe cast.
const action = data as Action | undefined;

// GOOD: runtime validation.
const isAction = (v: unknown): v is Action =>
  typeof v === "object" && v !== null && "type" in v;

if (isAction(data)) {
  data.type; // narrowed safely
}
```

## Error Handling

Vizel uses a single error model rooted at `VizelError`. Errors fall
into three categories, each with its own delivery channel:

| Category | Delivery | Examples |
|----------|----------|----------|
| Developer mistake (boundary) | `throw new VizelError(...)` | `INVALID_CONFIG`, `MISSING_CONTEXT` |
| Runtime error (recoverable) | `emitVizelError(err, options.onError)` | `UPLOAD_FAILED`, `EMBED_LOAD_FAILED` |
| Warning (advisory) | `emitVizelError(err, options.onError)` with `severity: "warning"` | `MARKDOWN_LOSSY` |

Rules:

- **No `console` calls** inside `packages/core/src/`. Biome's
  `noConsole` rule enforces this. The single sanctioned site is
  `emitVizelError` itself, which falls back to `console.error` when no
  callback is supplied.
- Always pass a stable `VizelErrorCode` — do not invent ad-hoc strings.
- Attach structured context via the `context` field (`{ url, file, ... }`)
  rather than embedding details in the message.
- Forward the underlying cause via the `cause` option so stack traces
  survive.
