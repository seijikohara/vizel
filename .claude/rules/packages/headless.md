---
paths:
  - "packages/headless/**/*"
---

# `@vizel/headless` Package

`@vizel/headless` provides framework-neutral UI primitives that every adapter consumes. The rationale lives in [ADR-0003](../../../docs/adr/ADR-0003-vizel-headless-package.md).

> **Status as of 2026-05-28**: this rule documents the target contract. The package scaffolds in Phase 2. Until then, treat this rule as the design specification.

## What the package contains

| Primitive | Purpose |
|-----------|---------|
| `combobox/` | Typeahead and roving tabindex for autocomplete-style menus |
| `popover/` | Positioning, dismissal, and portal target |
| `dismissable/` | Click-outside + Escape + focus return |
| `focus-trap/` | Focus boundary |
| `floating/` | `@floating-ui/dom` wrapper for positioning strategies |
| `keyboard/` | List navigation, typeahead, roving tabindex helpers |

Each primitive exports `{ buildSpec, createController }`. The spec is a pure function; the controller owns DOM side effects behind `{ mount(target), unmount(), update(args) }`.

## Dependency direction

- `@vizel/headless` depends on `@floating-ui/dom` (positioning) and standard DOM APIs only.
- `@vizel/headless` never imports React, Vue, or Svelte runtimes.
- The three adapter packages depend on `@vizel/headless`. Consumers do not depend on it directly; the package is transitive.

## Authoring constraints

- Tree-shakeable exports: import each primitive directly. Do not re-export everything from a single barrel.
- Every primitive ships with unit tests under `packages/headless/__tests__/`.
- Every primitive guards SSR (`typeof document === "undefined"`) so adapters can import the module at build time without DOM access.

## CSS

`@vizel/headless` ships no CSS. The single CSS catalogue lives in `@vizel/core/styles.css` (see [ADR-0008](../../../docs/adr/ADR-0008-css-belongs-in-core.md)).

## Migration target

The 21 `document.addEventListener` calls that currently live inside adapter components migrate into the `dismissable/` primitive during Phase 2. Adapter components consume the primitive thereafter; they never attach global listeners directly.
