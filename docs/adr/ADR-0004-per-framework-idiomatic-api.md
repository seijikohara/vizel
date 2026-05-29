# ADR-0004: Per-framework idiomatic API contract

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

[ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md) commits Vizel v2 to per-framework idiomatic APIs. This record names the specific idioms each adapter adopts.

## Decision

### `@vizel/react` (React 19)

- Hooks-first. Components are functional. Refs use `React.Ref<HTMLElement>`; the custom `VizelEditorRef` retires.
- `useVizelEditor(options): Editor | null` returns the editor directly. No destructured-getter wrappers.
- `useVizelEditorState<T>(selector, { equalityFn? }): T` is the selector subscription primitive. Implementation uses `useSyncExternalStore` (see [ADR-0009](./ADR-0009-first-party-editor-reactivity.md)).
- Imperative APIs surface through React 19's ref-as-prop convention (`ref` is a regular prop; `forwardRef` is intentionally not used — see `.claude/rules/packages/react.md`).
- Render-props use React's standard pattern: `children` of type `(props) => ReactNode`, or named function props.

### `@vizel/vue` (Vue 3.5)

- SFCs with `<script setup lang="ts">`.
- Two-way state surfaces via `defineModel<T>("name")`.
- Imperative APIs surface via `defineExpose({...})`.
- Scoped slots are typed with `defineSlots<...>()`.
- ARIA identifiers are derived deterministically from data in `@vizel/core` spec builders (SSR-safe by construction); `useId()` covers any adapter-local identifier a component must mint itself.
- Refs use `useTemplateRef<T>("name")`.
- Generic SFCs use `<script setup lang="ts" generic="T">`.
- The editor context binds through a typed `InjectionKey<ShallowRef<Editor | null>>`.

### `@vizel/svelte` (Svelte 5)

- Runes (`$state.raw`, `$derived`, `$effect`, `$bindable`) replace Svelte 4 idioms.
- The editor lives in `$state.raw<Editor | null>`. Re-assignment triggers reactivity; field mutation does not, which matches Tiptap's mutable Editor instance.
- Selector subscription uses `createSubscriber` from `svelte/reactivity` (see [ADR-0009](./ADR-0009-first-party-editor-reactivity.md)).
- Two-way state uses `$bindable()`.
- Render-props use `{#snippet}` with `Snippet<[Ctx]>`-typed parameters.
- All callback props use lowercase DOM-attribute names: `onclose`, `onselect`, `onsubmit`.
- Imperative APIs surface via `bind:this` on the component plus Svelte 5's component-export pattern.
- Context binds through typed `setVizelContext` / `getVizelContext` wrappers around `setContext` / `getContext`.

## Consequences

Positive:

- Each adapter feels native. Reviewers familiar with the framework recognise the patterns immediately.
- Adapter code shrinks because logic that previously simulated foreign idioms moves into Core and Headless.
- Per-framework tooling (Volar for Vue, the Svelte language server, React DevTools) integrates correctly because the code follows the framework's expected shape.

Negative:

- The migration from v1 demands per-framework documentation and code-mod recipes.
- Reviewers need familiarity with all three frameworks to assess cross-cutting changes. The feature manifest mitigates this by encoding parity in TypeScript.

Follow-up:

- Phase 3a, 3b, and 3c rewrite each adapter according to this contract.
- Update `.claude/rules/packages/{react,vue,svelte}.md` to document the binding idioms.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R3)
- Related: [ADR-0001](./ADR-0001-feature-parity-over-api-symmetry.md), [ADR-0009](./ADR-0009-first-party-editor-reactivity.md)
