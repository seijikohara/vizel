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

- Reactivity semantics stay under Vizel's control. SSR boundaries, selector semantics, and cleanup stay under one owner across adapters. The selector INPUT shape converges on a `{ editor, transaction }` snapshot only as a consequence of each framework's selector idiom plus the feature-parity requirement that every adapter read the transaction — not because Vizel pursues API symmetry. The RETURN/delivery stays framework-native: React returns `T`, Vue a `ComputedRef<T>`, Svelte a `$derived` accessor.
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

## Update (2026-06-03)

The Decision bullets above stay immutable. This Update corrects three
factual drifts between the Decision narrative and the shipped code. The
corrections describe the current implementation; they do not change the
decision.

- **React `getServerSnapshot` returns a version counter, not `null`.** The
  Decision bullet states `getServerSnapshot` returns `null` for SSR safety.
  The shipped store returns `0` — the initial value of the same monotonic
  version counter that `getSnapshot` returns on the client (see
  `packages/react/src/_reactivity.ts`). Returning the counter's zero value
  keeps the client and server snapshot types identical and satisfies the
  `useSyncExternalStore` contract.
- **React `subscribe` attaches both `transaction` and `selectionUpdate`.**
  The Decision bullet lists only `editor.on('transaction')`. The shipped
  `subscribe` attaches `editor.on('transaction')` and
  `editor.on('selectionUpdate')`, and detaches both in its cleanup. The
  selection listener lets a selector that reads selection-only state
  re-evaluate when the document content does not change.
- **The Svelte selector subscription lives in a separate rune file.** The
  Decision bullet attributes the `createSubscriber` selector subscription to
  `createVizelEditor.svelte.ts`. The shipped split is:
  `packages/svelte/src/runes/createVizelEditor.svelte.ts` holds only the
  `$state.raw<Editor | null>` editor identity, while
  `packages/svelte/src/runes/createVizelEditorState.svelte.ts` owns the
  selector projection — it subscribes through `createSubscriber` (hooking
  `transaction` and `selectionUpdate`) and exposes the result through a
  `$derived` accessor.

A later work item (WI-8) revises the React selector-input bullet separately;
this Update stays focused on the factual drift above.

## Update (2026-06-03, WI-8)

This Update records the selector-input correction the WI-9 Update deferred.
The Decision bullets above stay immutable; the correction describes the
shipped React selector contract.

- **The React `useVizelEditorState` selector receives a
  `{ editor, transaction }` snapshot, not the bare editor.** The Decision
  bullet writes the React signature as
  `useVizelEditorState(selector, { equalityFn? })` and the React adapter
  originally passed the selector the bare `Editor | null`. The shipped
  selector now receives a `VizelEditorSnapshot`
  (`{ editor: Editor | null; transaction: Transaction | null }`), matching
  the Vue and Svelte adapters. Two forces land on this shape independently:
  React's `useSyncExternalStore` / selector convention passes a selector a
  single snapshot object, and the feature manifest requires every adapter's
  selector to be able to read the transaction (only Vue and Svelte could
  before). The input shape therefore converges across adapters as a
  consequence of each framework idiom plus parity — not for API symmetry.
  The RETURN/delivery stays framework-native: React returns `T`, Vue a
  `ComputedRef<T>`, Svelte a `$derived` accessor.
- **Tearing-safety is preserved.** `getSnapshot` still returns the
  monotonic version counter, so the `useSyncExternalStore` referential
  contract is unchanged. The store records the latest transaction
  alongside the counter, and the hook rebuilds the `{ editor, transaction }`
  snapshot object only when the version counter advances (a new
  `transaction` / `selectionUpdate`) or the editor identity changes —
  mirroring the existing `useMemo([editor])` stability — so the snapshot
  object identity stays stable across no-op reads and the equality
  short-circuit holds under concurrent rendering.
