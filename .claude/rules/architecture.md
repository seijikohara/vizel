# Architecture

This rule states the binding architecture invariants for Vizel v2.0.0. The detailed rationale for each invariant lives in `docs/adr/`. Read the relevant ADR before changing a binding rule.

## Product identity

Vizel is a block-based visual Markdown editor built on Tiptap. The product:

- Edits content as Tiptap nodes (block-level structure) but Markdown is the source of truth on save and load. Tiptap's internal HTML is an editing-time representation, not a persisted format.
- Targets a Notion-like authoring experience: slash menu, drag handle, mentions, block menu, embeds, find-and-replace, version history, comments, collaboration.
- Ships React, Vue, and Svelte adapters around the same Tiptap configuration.

## Binding invariants

1. **`@vizel/core` stays framework-agnostic.** Core never imports React, Vue, or Svelte runtimes or types. It exposes Tiptap extensions, pure spec builders, controller factories (`{ mount, unmount, update }`), the feature manifest, and the single CSS catalogue.
2. **`@vizel/headless` provides framework-neutral primitives.** Combobox, popover, dismissable, focus-trap, floating, and keyboard helpers live here. Consumers do not depend on this package directly; adapter packages declare it as a dependency. See [ADR-0003](../../docs/adr/ADR-0003-vizel-headless-package.md).
3. **Adapter packages are thin transformers.** Each adapter expresses every feature in its framework's native idiom. See [ADR-0004](../../docs/adr/ADR-0004-per-framework-idiomatic-api.md). Component files stay at or under 120 view-template lines; logic that overflows moves into Core or Headless. See [ADR-0007](../../docs/adr/ADR-0007-component-size-and-controller-delegation.md).
4. **Editor reactivity is first-party in every adapter.** React uses `useSyncExternalStore`; Vue uses `shallowRef` + `onScopeDispose`-bound listeners; Svelte uses `$state.raw` + `createSubscriber`. `@tiptap/react` and `@tiptap/vue-3` are not depended on. See [ADR-0009](../../docs/adr/ADR-0009-first-party-editor-reactivity.md).
5. **Feature parity is enforced by the feature manifest.** The SSOT is `packages/core/src/feature-manifest.ts`; `pnpm check:feature-parity` verifies coverage. API symmetry across frameworks is explicitly NOT a goal. See [ADR-0001](../../docs/adr/ADR-0001-feature-parity-over-api-symmetry.md) and [ADR-0002](../../docs/adr/ADR-0002-feature-manifest-as-parity-ssot.md).

## Consumer-facing invariants

- **Import surface.** Installing one of `@vizel/react`, `@vizel/vue`, or `@vizel/svelte` is sufficient. `@vizel/core` and `@vizel/headless` are transitive dependencies.
- **Style surface.** A single CSS entry per adapter (e.g. `@vizel/react/styles.css`) resolves to `@vizel/core/styles.css`. The CSS ships under two selectors — `:root, [data-vizel-theme="light"]` and `[data-vizel-theme="dark"]` — plus the `prefers-color-scheme: dark` fallback. Host theming integrates by setting `data-vizel-theme`. See [ADR-0008](../../docs/adr/ADR-0008-css-belongs-in-core.md).
- **Loud errors at boundaries.** Misuse surfaces as a typed `VizelError` carrying a stable `VizelErrorCode`. Configuration mistakes throw; runtime input errors flow through `emitVizelError` and the consumer-supplied `onError` callback. `console.warn` and `console.error` are banned in `packages/core/src/` except inside `emitVizelError`.
- **SSR safe.** All Core utilities guard `document` / `window` access. Adapter components mount DOM-touching controllers only inside the framework's lifecycle hook (`useEffect`, `onMounted`, `$effect`).

## When to deviate

These invariants are binding. If a feature seems to require deviation, write an ADR under `docs/adr/` in the same pull request that introduces the deviation. Drift without an ADR is a review-blocker.

## Decision records

See `docs/adr/README.md` for the full ADR index covering API parity, feature manifest, headless package, per-framework idiom, breaking-release policy, CSS centralisation, first-party reactivity, `.claude/` format, technical-writing style, and the Playwright CT three-layer rebuild.
