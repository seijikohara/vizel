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

## Immutability

The project's TypeScript surface is immutability-first. `let` declarations
are banned outside Svelte components and runes — every reassignable
counter, accumulator, or timer handle lives in a typed state object so the
file scope never needs `let`.

### Why

- Loops with mutable accumulators obscure data flow. The functional
  equivalents (`.reduce`, `.flatMap`, ternary, recursion) localize the
  computation and read top-to-bottom.
- A closure-shared `const state = { ... }` object is type-checkable,
  refactor-safe, and survives a `Find Usages` query that a `let`
  binding inside a function does not.
- Forbidding `let` removes an entire class of `let-vs-const` review
  comments and keeps the codebase consistent across thousands of files.

### Scope

| In scope | Excluded |
|----------|----------|
| `packages/core/src/**/*.ts` | `packages/svelte/src/**/*.{svelte,svelte.ts}` |
| `packages/react/src/**/*.{ts,tsx}` | `apps/demo/svelte/src/**/*.svelte` |
| `packages/vue/src/**/*.{ts,vue}` (`<script setup>` blocks) | `tests/ct/svelte/specs/**/*.svelte` |
| `scripts/**/*.ts` | Any `*.svelte.ts` rune file |
| `tests/ct/scenarios/**/*.ts` | Any `*.d.ts` |
| `tests/ct/react/specs/**/*.{ts,tsx}` | `node_modules/`, `dist/`, `.svelte-kit/`, `.vite/`, `.cache/` |
| `tests/ct/vue/specs/**/*.{ts,vue}` (script blocks only) | |
| `apps/demo/{react,vue}/src/**/*.{ts,tsx,vue}` (script blocks only) | |

Svelte is excluded because Svelte 5's reactivity model treats top-level
`let` (and runes like `$state(...)`) as the canonical reactivity primitive.

### Escape hatch

When a third-party API (typically a Tiptap / ProseMirror plugin's
`addProseMirrorPlugins` closure that captures mutable state across
transactions) genuinely requires a mutable binding, opt out with a
required-reason ignore comment on the preceding line or the same line:

```ts
// biome-ignore lint/style/noLet: ProseMirror plugin state must be mutable.
let decoSet = currentSet.map(tr.mapping, tr.doc);
```

The `<reason>` text is mandatory and is surfaced in code review.

### Enforcement

`pnpm check:nolet` (`scripts/check-no-let.ts`) walks the in-scope
directories listed above, skips Svelte files and build artifacts, and
exits non-zero on any unguarded `let` binding. Lefthook runs the same
check on `pre-push`, and CI gates merges on a green run. Run it locally
before opening a PR.

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
