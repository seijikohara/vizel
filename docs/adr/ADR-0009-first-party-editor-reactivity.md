# ADR-0009: First-party editor reactivity in every adapter

- **Status**: Accepted
- **Date**: 2026-05-28
- **Targets**: v2.0.0

## Context

Tiptap ships official framework integrations for React (`@tiptap/react`) and Vue (`@tiptap/vue-3`). Both packages export `useEditor` and `useEditorState({ editor, selector, equalityFn? })`. No official Svelte integration exists; the community option `svelte-tiptap` targets Tiptap v2 and Svelte 4.

Two options exist for v2:

- Depend on `@tiptap/react` and `@tiptap/vue-3` for React and Vue; implement Svelte natively.
- Implement reactivity natively in every adapter.

The maintainer's directive: "3FW 全て Vizel 独自実装".

## Decision

Vizel v2 implements editor reactivity natively in every adapter. The only Tiptap runtime dependencies live in `@vizel/core` and are `@tiptap/core`, `@tiptap/pm`, and the per-feature `@tiptap/extension-*` packages. `@tiptap/react` and `@tiptap/vue-3` are not depended on anywhere in the repository.

Per-adapter implementation:

- **React 19**: `packages/react/src/_reactivity.ts` provides a `useSyncExternalStore`-backed editor store. `subscribe` attaches `editor.on('transaction')` and returns a cleanup. `getSnapshot` returns a monotonic version counter so the selector re-evaluates. `getServerSnapshot` returns `null` for SSR safety. `useVizelEditor` and `useVizelEditorState(selector, { equalityFn? })` share this store.
- **Vue 3.5**: `packages/vue/src/_reactivity.ts` holds the editor in `shallowRef<Editor | undefined>` and re-assigns on transaction. The transaction listener attaches inside the composable and detaches in `onScopeDispose`. The composable users cannot leak listeners.
- **Svelte 5**: `packages/svelte/src/runes/createVizelEditor.svelte.ts` holds the editor in `$state.raw<Editor | null>`. Selector subscription uses `createSubscriber` from `svelte/reactivity`, which hooks `editor.on('transaction')` once and registers dependencies through the rune system. `createVizelEditorState(selector, { equalityFn? })` re-runs the selector on every transaction and short-circuits via the equality function.

## Consequences

Positive:

- Reactivity semantics stay under Vizel's control. SSR boundaries, selector semantics, and cleanup behave identically across adapters because Vizel writes the same contract three times.
- The Tiptap dependency surface shrinks. The runtime closure no longer pulls in two framework integrations the project does not consume.
- The Svelte implementation is no longer the divergent case. Every adapter follows the same "first-party reactivity" pattern.

Negative:

- Vizel must track Tiptap's React and Vue integrations for performance improvements (e.g., `shouldRerenderOnTransaction: false` semantics) and port them into `_reactivity.ts`. The maintenance cost is real.
- Tearing-safety under React 19 concurrent rendering depends on getting the `useSyncExternalStore` contract right. Phase 3a's tests cover transaction interleaving explicitly.

Follow-up:

- Phase 3a and 3b implement `_reactivity.ts` in their respective adapters. Phase 3c relies on `createSubscriber`.
- A quarterly review of Tiptap's React and Vue changelogs identifies performance work to port.

## References

- Plan: `/Users/seiji/.claude/plans/starry-petting-planet.md` (R3, Phase 3)
- External: [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore), [`svelte/reactivity` `createSubscriber`](https://svelte.dev/docs/svelte/svelte-reactivity)
- Related: [ADR-0004](./ADR-0004-per-framework-idiomatic-api.md), [ADR-0007](./ADR-0007-component-size-and-controller-delegation.md)
