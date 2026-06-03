# `_internal/` — implementation-private symbols

This directory holds symbols that `@vizel/core` uses internally but that
must not appear in the public API.

## Rules

- Nothing in this directory is exported from `packages/core/src/index.ts`.
- Framework packages (`@vizel/react`, `@vizel/vue`, `@vizel/svelte`) must
  not re-export symbols from this directory.
- The directory exists to give internal helpers a clear home and to let
  `scripts/check-reexport-mirror.ts` distinguish public from internal
  exports physically rather than by convention.

## Examples of suitable contents

- Lazy-loader helper (`createLazyOptionalLoader`)
- Diagnostic emitter (`emitVizelError`)
- Test fixtures shared across internal tests but not exposed to
  consumers

See `.claude/rules/packages/core.md` for the full policy.
