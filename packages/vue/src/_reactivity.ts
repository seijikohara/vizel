/**
 * First-party Vue reactivity primitive for the Vizel editor.
 *
 * Every adapter implements selector subscriptions first-party so the SSR
 * boundary, the selector contract, and the
 * cleanup behaviour stay under Vizel's control. The Vue implementation
 * holds the editor in a `shallowRef<Editor | undefined>` and bumps a
 * monotonic `ref<number>` counter inside `editor.on('transaction')` and
 * `editor.on('selectionUpdate')` listeners. The listeners attach inside
 * the composable and detach through `onScopeDispose`, so consumers cannot
 * leak handlers regardless of where they call `useVizelEditorState`.
 *
 * The selector receives a `{ editor, transaction }` snapshot. Vue's
 * `computed`-based selector idiom passes the selector a single value, so
 * the Vue-idiomatic form lands on a snapshot rather than a bare editor,
 * and the snapshot exposes the transaction the feature manifest requires
 * every adapter to read. The selector INPUT shape converges across the
 * React, Vue, and Svelte adapters only as a consequence of each
 * framework idiom plus feature parity — not for API symmetry. The
 * RETURN/delivery diverges idiomatically: this composable returns a
 * `ComputedRef<T>`, React returns `T`, and Svelte returns a `$derived`
 * accessor.
 *
 * The composable exposes a single public function (`useVizelEditorState`)
 * plus two equality helpers re-exported from `@vizel/core`. Consumers
 * select the slice they care about and optionally supply an `equalityFn`
 * to suppress no-op recomputations when the slice is structurally
 * unchanged.
 *
 * Every adapter implements reactivity first-party, so
 * Vizel owns the selector contract and cleanup behaviour and depends on
 * no `@tiptap/vue-3` reactivity layer.
 */

import type { Transaction } from "@tiptap/pm/state";
import { type Editor, shallowEqualArray, shallowEqualObject } from "@vizel/core";
import { type ComputedRef, computed, onMounted, onScopeDispose, ref, shallowRef, watch } from "vue";

import { useVizelContextSafe } from "./components/VizelContext.ts";

/**
 * Snapshot exposed to a `useVizelEditorState` selector.
 *
 * The snapshot stays referentially stable per transaction: the same
 * object passes to consecutive selector evaluations triggered by the
 * same notification, while `transaction` reflects the value Tiptap
 * delivered on the most recent `transaction` or `selectionUpdate`
 * event. `transaction` is `null` until the first event fires — most
 * commonly during the SSR pass and the first browser render before
 * Tiptap has dispatched any transaction.
 */
export interface VizelEditorSnapshot {
  /** The active editor instance, or `null` while it is still initializing. */
  readonly editor: Editor | null;
  /** The transaction that triggered the most recent re-evaluation, or `null` before the first event. */
  readonly transaction: Transaction | null;
}

/** Options accepted by {@link useVizelEditorState}. */
export interface UseVizelEditorStateOptions<T> {
  /**
   * Equality predicate the composable applies to consecutive selector
   * results. `Object.is` is the default; the bundled
   * {@link shallowEqualArray} and {@link shallowEqualObject} cover
   * the shapes selectors typically return.
   */
  readonly equalityFn?: (a: T, b: T) => boolean;
}

/**
 * Subscribe to a slice of the editor's state.
 *
 * The composable reads the editor from the surrounding `VizelProvider`
 * via {@link useVizelContextSafe}. Outside a provider, the context
 * returns `null` and the selector always observes the absence shape
 * (`{ editor: null, transaction: null }`). Inside a provider, the
 * composable mirrors the injected `ShallowRef<Editor | null>` into a
 * private `shallowRef<Editor | undefined>` and re-attaches transaction
 * listeners whenever the editor identity changes. The returned
 * `ComputedRef<T>` re-evaluates the selector whenever the editor
 * identity changes or the internal version counter increments.
 *
 * `equalityFn` short-circuits notifications when the new selector
 * result is structurally identical to the previous one. The composable
 * reuses the previous returned value so consumers can safely compare
 * with `Object.is` against the computed's `.value`.
 *
 * The composable is SSR safe: `editor` stays `undefined` until
 * `onMounted` runs in the consumer, so the selector receives
 * `{ editor: null, transaction: null }` during server rendering.
 *
 * Transaction listeners detach in `onScopeDispose`. Calling the
 * composable inside `effectScope()` or a child component cleans up
 * automatically when the scope tears down, which removes the leak
 * footgun a manual `onBeforeUnmount` registration would carry.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditorState } from "@vizel/vue";
 * const isBold = useVizelEditorState(({ editor }) => editor?.isActive("bold") ?? false);
 * </script>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { shallowEqualObject, useVizelEditorState } from "@vizel/vue";
 * const marks = useVizelEditorState(
 *   ({ editor }) => ({
 *     bold: editor?.isActive("bold") ?? false,
 *     italic: editor?.isActive("italic") ?? false,
 *   }),
 *   { equalityFn: shallowEqualObject },
 * );
 * </script>
 * ```
 */
export function useVizelEditorState<T>(
  selector: (snapshot: VizelEditorSnapshot) => T,
  options?: UseVizelEditorStateOptions<T>
): ComputedRef<T> {
  // Read the surrounding provider; `useVizelContextSafe` returns `null`
  // when no provider is mounted so the composable mirrors `null` from
  // the selector instead of throwing — selector-style hooks must work
  // in unscoped contexts (story-driven harnesses, isolated tests).
  const contextEditor = useVizelContextSafe();

  // The local editor mirror holds `undefined` during SSR and the first
  // pre-mount render so the selector observes a deterministic absence
  // shape. The store narrows `undefined` to `null` before handing the
  // snapshot to the selector, which keeps the public contract simple.
  const editorRef = shallowRef<Editor | undefined>(undefined);

  // A monotonic version counter forces `computed` to re-run when the
  // editor identity is stable but Tiptap notifies a transaction. A
  // ref-backed counter is the cheapest way to plug into Vue's
  // dependency-tracking pipeline; the value itself is opaque to
  // consumers.
  const version = ref(0);

  // The most recent transaction payload — `null` until the first
  // `transaction` or `selectionUpdate` event fires. Tiptap surfaces
  // the transaction on both events, so the selector observes a
  // consistent shape regardless of which signal fired.
  const lastTransaction = shallowRef<Transaction | null>(null);

  // Track the currently attached editor so we can detach its
  // listeners before swapping to a new one. A closure-shared object
  // keeps the binding `const`-safe at the file scope (see
  // `.claude/rules/code-style.md` on `let` avoidance).
  const attachment: { editor: Editor | null; detach: (() => void) | null } = {
    editor: null,
    detach: null,
  };

  const detachListeners = (): void => {
    attachment.detach?.();
    attachment.editor = null;
    attachment.detach = null;
  };

  const attachListeners = (editor: Editor): void => {
    // Bump the version counter on every transaction / selection
    // update so the computed re-evaluates. Tiptap dispatches a
    // `transaction` for document and metadata changes and a separate
    // `selectionUpdate` for pure-cursor moves; the bubble menu and the
    // toolbar's active state depend on the selection signal, so the
    // composable subscribes to both events for parity with the React
    // primitive in `_reactivity.ts`.
    const onTransaction = (payload: { editor: Editor; transaction: Transaction }): void => {
      lastTransaction.value = payload.transaction;
      version.value = (version.value + 1) | 0;
    };
    const onSelectionUpdate = (payload: { editor: Editor; transaction: Transaction }): void => {
      lastTransaction.value = payload.transaction;
      version.value = (version.value + 1) | 0;
    };
    editor.on("transaction", onTransaction);
    editor.on("selectionUpdate", onSelectionUpdate);
    attachment.editor = editor;
    attachment.detach = () => {
      editor.off("transaction", onTransaction);
      editor.off("selectionUpdate", onSelectionUpdate);
    };
  };

  // Defer the initial mirror to `onMounted` so SSR passes never touch
  // Tiptap's editor instance. Vue calls `onMounted` only inside the
  // browser, which keeps the snapshot deterministic across server and
  // client renders before the first transaction fires.
  onMounted(() => {
    // Sync the mirror to the current context value and re-sync on
    // every change. `watch` with `immediate: true` covers the initial
    // case; the subsequent invocations handle provider-driven editor
    // swaps. The watcher reads `.value` on the `ShallowRef`, so Vue's
    // reactivity tracks the identity change without depth-traversing
    // the editor itself.
    watch(
      () => contextEditor?.value ?? null,
      (nextEditor) => {
        if (attachment.editor === nextEditor) return;
        detachListeners();
        editorRef.value = nextEditor ?? undefined;
        if (nextEditor === null) {
          lastTransaction.value = null;
          return;
        }
        attachListeners(nextEditor);
      },
      { immediate: true }
    );
  });

  // Detach in `onScopeDispose` rather than `onBeforeUnmount` so the
  // composable cleans up correctly inside detached effect scopes
  // (`effectScope()`) too. Vue dispatches `onScopeDispose` whether the
  // host is a component or a free-standing scope, so consumers cannot
  // leak transaction handlers regardless of where they invoke the
  // composable.
  onScopeDispose(() => {
    detachListeners();
  });

  // Closure-shared cache that keeps the previous selector result
  // available for short-circuiting. A discriminated union carries the
  // typed value without an `as` cast or non-null assertion.
  type SnapshotCache = { kind: "empty" } | { kind: "cached"; value: T };
  const cache: { current: SnapshotCache } = { current: { kind: "empty" } };

  const equalityFn = options?.equalityFn ?? Object.is;

  return computed<T>(() => {
    // Read the version counter so Vue tracks transaction notifications
    // as an explicit dependency. Without this read, the computed would
    // only re-run on editor identity changes, which would miss every
    // intra-editor transaction the selector cares about.
    void version.value;

    // Narrow the mirror to the public `Editor | null` shape. The
    // `undefined` sentinel is an internal detail that signals
    // "pre-mount" — consumers should observe `null` instead so the
    // SSR and post-mount snapshot shapes stay identical.
    const snapshot: VizelEditorSnapshot = {
      editor: editorRef.value ?? null,
      transaction: lastTransaction.value,
    };
    const next = selector(snapshot);

    const previous = cache.current;
    if (previous.kind === "cached" && equalityFn(previous.value, next)) {
      // Returning the cached reference keeps `Object.is` against the
      // previous `.value` stable for downstream computeds and watchers
      // that compare the slice identity.
      return previous.value;
    }
    cache.current = { kind: "cached", value: next };
    return next;
  });
}

export { shallowEqualArray, shallowEqualObject };
