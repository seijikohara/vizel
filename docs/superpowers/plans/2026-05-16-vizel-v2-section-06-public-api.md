# Section 6: Public API Surface Unification — Implementation Plan

**Goal:** Make `@vizel/{react,vue,svelte}` self-sufficient for consumers. Add `export * from "@vizel/core"` to each framework's `index.ts`. Add Tiptap symbol re-exports. Tighten the parity script to enforce the mirror.

**Architecture:** Three sub-PRs.

- **6a** — Add `export * from "@vizel/core"` to each framework `index.ts`. Add Tiptap type re-exports to `@vizel/core/src/index.ts`. Update existing demo / test code that imported from `@vizel/core` directly (where the import could now resolve from the framework package).
- **6b** — Tighten `scripts/check-cross-framework-parity.ts` (or split out a `scripts/check-reexport-mirror.ts`). The existing informational note becomes a hard error: every Core public symbol must appear in each framework's runtime exports.
- **6c** — `package.json` subpath exports for CSS. Section 13 will further refine theming; this PR only declares the subpath exports so `import "@vizel/react/styles.css"` resolves. Defer the actual CSS split (variables.css, components.css) to Section 13.

## Sub-PR 6a — `export *` mirror + Tiptap re-exports

### Task 6a-1 — Add Tiptap type re-exports to `@vizel/core/src/index.ts`

Add at the top of the file (before alphabetical local exports):

```ts
// Tiptap symbol re-exports — see Section 6 of the v2.0.0 spec.
export type {
  ChainedCommands,
  Editor,
  Extensions,
  JSONContent,
  Range,
} from "@tiptap/core";
```

### Task 6a-2 — Add `export * from "@vizel/core"` to each framework `index.ts`

For each of `packages/{react,vue,svelte}/src/index.ts`:

- Insert `export * from "@vizel/core";` as the first export line (after any `"use client"` directive in React).
- Audit for symbol conflicts: framework packages may locally export a symbol that also lives in Core (e.g. `VizelError`, helpers). Resolve by removing the local re-export of Core symbols.

### Task 6a-3 — Update demo / test imports

Demo apps (`apps/demo/{react,vue,svelte}`) and CT tests (`tests/ct/{react,vue,svelte}`) may import from `@vizel/core` directly. Where the import resolves equally well via the framework package, switch to the framework package for consistency with consumer guidance. Demos should model best practice.

### Task 6a-4 — Open and merge PR 6a.

## Sub-PR 6b — Enforce mirror in CI

### Task 6b-1 — Promote the informational note to a hard error

In `scripts/check-cross-framework-parity.ts`, replace the `note:` print about missing `export * from "@vizel/core"` with an exit-1 failure. Re-run on `main` (after 6a merges) and confirm it exits 0.

### Task 6b-2 — Verify symbol-by-symbol mirror

Extend the script (or add `scripts/check-reexport-mirror.ts`) that:

1. Parses `@vizel/core/src/index.ts` and collects all exported symbols.
2. Parses each framework's `dist/index.d.ts` (or `src/index.ts` if dist is unbuilt) and confirms every Core symbol is reachable.
3. Fails with a list of missing symbols per framework.

### Task 6b-3 — Open and merge PR 6b.

## Sub-PR 6c — `package.json` subpath exports

### Task 6c-1 — Add subpath exports to each framework `package.json`

Add `./styles.css` to `exports` in each framework's `package.json`. The actual file may not exist yet at `dist/styles.css` (Section 13 splits CSS) — for 6c, ensure the existing single CSS bundle resolves through `./styles.css`. If consumers currently `import "@vizel/react/dist/styles.css"`, update the docs / demos to use the cleaner `import "@vizel/react/styles.css"`.

### Task 6c-2 — Update demo CSS imports

Each demo's entry file imports CSS — update to use the new subpath.

### Task 6c-3 — Open and merge PR 6c.

## Acceptance Criteria

- Each framework `src/index.ts` starts with `export * from "@vizel/core"`.
- `@vizel/core/src/index.ts` re-exports the 5 Tiptap types listed in the spec.
- `scripts/check-cross-framework-parity.ts` fails if the mirror is removed.
- `import "@vizel/react/styles.css"` resolves through the new subpath export.
