# ADR-0003: `@vizel/headless` as a transitive package

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

v1 framework adapters re-implement the same UI primitives in three places: combobox keyboard navigation, popover positioning, dismissable layers (outside-click plus Escape), focus traps, and floating positioning. The audit counts 21 direct `document.addEventListener` calls inside framework components, every one of them banned by the architecture rule and propagated through copy-paste.

The framework-neutral primitives must live in a single place so the adapters cannot re-implement them.

## Decision

Vizel v2 introduces a new package, `@vizel/headless`, that exports framework-neutral UI primitives:

- `combobox/` — typeahead and roving tabindex for autocomplete-style menus.
- `popover/` — positioning, dismissal, and portal target.
- `dismissable/` — click-outside + Escape + focus return. Owns the listeners that used to land in framework components.
- `focus-trap/` — focus boundary.
- `floating/` — `@floating-ui/dom` wrapper.
- `keyboard/` — list navigation, typeahead, roving tabindex helpers.

Each primitive ships as `{ buildSpec, createController }`. The package depends only on pure DOM APIs; it imports no framework runtime.

`@vizel/headless` is declared as a dependency (not a peer dependency) of every adapter package. Consumers do not declare it directly. From the consumer's perspective the package is transitive:

```
consumer/package.json
└── "@vizel/react": "2.0.0"        ← only declared dep

   @vizel/react@2.0.0
   └── dependencies:
       ├── @vizel/core: "2.0.0"
       └── @vizel/headless: "2.0.0"  ← transitive, resolved by the package manager
```

## Consequences

Positive:

- The 21 `document.addEventListener` violations in adapter code collapse to zero. Listeners live in `dismissable/` and are mounted by the framework's lifecycle hook.
- Each adapter shrinks: shared UI logic moves out of components.
- Future support for additional frameworks (Solid, Qwik) becomes cheaper. The primitives already exist.

Negative:

- One more package to release in lockstep. Phase 5 publish coordinates `@vizel/core`, `@vizel/headless`, and the three adapters.
- The primitives must be tree-shakeable. The package does not export barrel files; adapters import each primitive directly to keep bundle size low.

Follow-up:

- Phase 2 scaffolds the package and migrates the primitives one at a time.
- Unit tests in `packages/headless/` cover each primitive before any adapter consumes it.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (Phase 2)
- Related: [ADR-0007](./ADR-0007-component-size-and-controller-delegation.md), [ADR-0008](./ADR-0008-css-belongs-in-core.md)

## Update (2026-05-29)

The Decision's dependency graph shows each adapter depending on both `@vizel/core` and `@vizel/headless`. As the primitives landed, `@vizel/core` controllers were rebased onto them: `@vizel/core/controllers/popover` re-exports the `@vizel/headless/popover` primitive (composed from `floating` + `dismissable`), and the core list-navigation helpers moved into `@vizel/headless/keyboard`. `@vizel/core` therefore now declares `@vizel/headless` as a dependency. The edge is acyclic — `@vizel/headless` imports no framework runtime and does not depend on `@vizel/core` — and it removes the duplicated primitive logic that previously lived in both packages. The consumer-facing model is unchanged: installing one adapter is sufficient, and `@vizel/core` and `@vizel/headless` remain transitive.

The `floating` primitive wraps `@floating-ui/dom` (declared as a `@vizel/headless` dependency and externalised from the build); see the ADR-0014 update for the bundle-budget note.
