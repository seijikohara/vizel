"use client";

/**
 * First-party React reactivity primitive for the Vizel editor.
 *
 * The module owns selector subscriptions without depending on
 * `@tiptap/react`. ADR-0009 mandates a first-party implementation in every
 * adapter so the SSR boundary, the selector contract, and the cleanup
 * behaviour stay under Vizel's control. The React implementation wraps a
 * monotonic version counter inside `useSyncExternalStore`, which React's
 * official guidance recommends for editor-style external stores that must
 * stay tearing-safe under concurrent rendering.
 *
 * The selector receives a `{ editor, transaction }` snapshot. React's
 * `useSyncExternalStore` / selector convention passes a selector a single
 * snapshot object, so the React-idiomatic form lands on a snapshot rather
 * than a bare editor. That same shape lets a React selector read the
 * transaction, closing the feature-parity gap the Vue and Svelte adapters
 * already covered. The input shape converges across adapters only as a
 * consequence of each framework idiom plus parity; the return value stays
 * framework-native — React returns `T`, Vue a `ComputedRef<T>`, Svelte a
 * `$derived` accessor.
 *
 * The module exposes one public hook (`useVizelEditorState`) plus two
 * equality helpers re-exported from `@vizel/core`. Consumers select the
 * slice they care about and optionally supply an equality function to
 * suppress re-renders when the slice is structurally unchanged. Every
 * framework component, including `useVizelEditor`, subscribes through the
 * same store so selector behaviour stays uniform.
 */

import type { Transaction } from "@tiptap/pm/state";
import { type Editor, shallowEqualArray, shallowEqualObject } from "@vizel/core";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { useVizelContextSafe } from "./components/VizelContext.tsx";

/**
 * Snapshot delivered to a {@link useVizelEditorState} selector on every
 * re-evaluation.
 *
 * The snapshot pairs the editor identity with the transaction that drove
 * the most recent notification. `transaction` is `null` until the first
 * `transaction` or `selectionUpdate` event fires — most commonly during
 * the SSR pass and the first browser render before Tiptap has dispatched
 * any transaction.
 */
export interface VizelEditorSnapshot {
  /** The active editor instance, or `null` while it is still initializing. */
  readonly editor: Editor | null;
  /** The transaction that triggered the most recent re-evaluation, or `null` before the first event. */
  readonly transaction: Transaction | null;
}

/**
 * Shape returned by {@link createEditorStore} — a `useSyncExternalStore`
 * adapter pinned to a single editor instance.
 *
 * The store does not surface the editor itself. The version counter
 * (returned by `getSnapshot`) increments on every transaction, which
 * forces React to invoke the selector against the latest editor state
 * without changing the snapshot's referential identity contract. The
 * store also records the most recent transaction so the hook can build a
 * `{ editor, transaction }` snapshot for the selector.
 */
export interface VizelReactEditorStore {
  /**
   * Attach a transaction listener and return the cleanup. The store
   * subscribes to both `transaction` and `selectionUpdate` so menus
   * driven by selection changes (the bubble menu, the toolbar's active
   * state) react without forcing every consumer to track both events.
   */
  subscribe(onChange: () => void): () => void;
  /**
   * Read the current version counter. The counter increments by one on
   * every notification with 32-bit wrap-around so it never grows
   * unbounded over long editing sessions.
   */
  getSnapshot(): number;
  /**
   * SSR snapshot — always zero. React calls `getServerSnapshot` during
   * server rendering, where the editor has not yet mounted. Returning a
   * stable value avoids hydration mismatches.
   */
  getServerSnapshot(): number;
  /**
   * Read the transaction that drove the most recent notification, or
   * `null` before the first `transaction` / `selectionUpdate` event. The
   * hook reads this lazily when it rebuilds the snapshot, so the value
   * never enters the version counter's referential-stability contract.
   */
  getTransaction(): Transaction | null;
}

/**
 * Build a {@link VizelReactEditorStore} for the supplied editor.
 *
 * The factory is an internal building block consumed by
 * {@link useVizelEditorState} and by the `useVizelEditor` hook itself.
 * The factory is intentionally
 * framework-agnostic at the function-signature level — it only depends
 * on Tiptap's `Editor.on` / `Editor.off` event surface — so the test
 * suite can exercise it without rendering React.
 *
 * @internal
 */
export function createEditorStore(editor: Editor | null): VizelReactEditorStore {
  // Closure-shared mutable state. A typed object keeps the binding
  // const-safe at the file scope and survives `Find Usages` better than
  // a free `let` would (see `.claude/rules/code-style.md`). `transaction`
  // holds the payload from the most recent notification; the version
  // counter alone drives `getSnapshot`'s referential-stability contract.
  const state: { version: number; transaction: Transaction | null } = {
    version: 0,
    transaction: null,
  };

  const bumpVersion = (): void => {
    // 32-bit wrap-around stops the counter from drifting toward
    // unsafe-integer territory on long editing sessions. The actual
    // numeric value is opaque to consumers; only the change matters.
    state.version = (state.version + 1) | 0;
  };

  return {
    subscribe(onChange) {
      if (editor === null) {
        // SSR snapshot already returns zero and never changes, so React
        // never calls `subscribe` outside the browser. Guard anyway in
        // case a consumer triggers a manual re-render with `editor: null`.
        return () => {
          /* no-op cleanup when the editor is still initializing */
        };
      }
      const handler = (payload: { editor: Editor; transaction: Transaction }): void => {
        // Record the transaction before bumping the version so the
        // snapshot the hook rebuilds on the next read pairs the editor
        // with the transaction that drove this notification. Tiptap
        // surfaces the transaction on both events, so the selector
        // observes a consistent shape regardless of which signal fired.
        state.transaction = payload.transaction;
        bumpVersion();
        onChange();
      };
      // Tiptap exposes a single `transaction` event for document /
      // selection / metadata updates. The bubble menu, the toolbar, and
      // the find-replace panel all depend on the selection signal, so
      // the store subscribes to `selectionUpdate` too for consumers that
      // would otherwise miss pure-cursor moves.
      editor.on("transaction", handler);
      editor.on("selectionUpdate", handler);
      return () => {
        editor.off("transaction", handler);
        editor.off("selectionUpdate", handler);
      };
    },
    getSnapshot() {
      return state.version;
    },
    getServerSnapshot() {
      return 0;
    },
    getTransaction() {
      return state.transaction;
    },
  };
}

/**
 * Options accepted by {@link useVizelEditorState}.
 */
export interface UseVizelEditorStateOptions<T> {
  /**
   * Equality predicate the hook applies to consecutive selector
   * results. `Object.is` is the default; the bundled
   * {@link shallowEqualArray} and {@link shallowEqualObject} cover
   * the shapes that selectors typically return.
   */
  readonly equalityFn?: (a: T, b: T) => boolean;
  /**
   * Editor instance to subscribe to. Defaults to the editor resolved
   * from the surrounding `VizelProvider`. A component that already
   * receives the editor as a prop passes it here so the selector
   * subscribes to that exact instance even when no provider wraps the
   * component (for example, a standalone `<VizelToolbar editor={...} />`).
   */
  readonly editor?: Editor | null;
}

/**
 * Subscribe to a slice of the editor's state.
 *
 * The hook reads the editor instance from the surrounding `VizelProvider`
 * (or returns `null` while no provider is mounted, mirroring
 * {@link useVizelContextSafe}). Pass `options.editor` to subscribe to an
 * explicit instance instead — a component that receives the editor as a
 * prop uses it so the selector still tracks state when no provider wraps
 * the component. The hook then wraps a per-editor store inside
 * `useSyncExternalStore` so React re-runs the selector on every
 * transaction. The hook short-circuits via the supplied `equalityFn`
 * (defaulting to `Object.is`), preventing re-renders when the slice is
 * structurally unchanged.
 *
 * Tearing-safety under React 19 concurrent rendering is the load-bearing
 * reason for `useSyncExternalStore` here: React routes every snapshot
 * read through the official store contract, so two concurrently
 * scheduled trees never observe inconsistent editor state.
 *
 * @example
 * ```tsx
 * const isBold = useVizelEditorState(({ editor }) => editor?.isActive("bold") ?? false);
 * ```
 *
 * @example
 * ```tsx
 * const marks = useVizelEditorState(
 *   ({ editor }) => ({
 *     bold: editor?.isActive("bold") ?? false,
 *     italic: editor?.isActive("italic") ?? false,
 *   }),
 *   { equalityFn: shallowEqualObject },
 * );
 * ```
 */
export function useVizelEditorState<T>(
  selector: (snapshot: VizelEditorSnapshot) => T,
  options?: UseVizelEditorStateOptions<T>
): T {
  const contextEditor = useVizelContextSafe();
  // The explicit override wins so a component holding the editor as a
  // prop subscribes to that instance; otherwise the hook tracks the
  // provider's editor. `undefined` means "no override supplied"; an
  // explicit `null` (editor still initializing) falls back to context so
  // a parent that passes `editor={null}` before mount does not lose the
  // provider's eventual instance.
  const editor = options?.editor ?? contextEditor;

  // Pin the latest selector / equality predicate inside refs so the
  // snapshot reader closure never goes stale across renders. The
  // closures handed to `useSyncExternalStore` must stay referentially
  // stable; capturing the parameters directly would force React to
  // re-subscribe on every render that supplies a fresh inline selector.
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const equalityRef = useRef<(a: T, b: T) => boolean>(options?.equalityFn ?? Object.is);
  equalityRef.current = options?.equalityFn ?? Object.is;

  // Build the store and the snapshot reader once per editor instance.
  // The closure-shared `cache` slot keeps the previous selector result
  // available so `equalityFn` short-circuits never break the
  // referential-stability contract `useSyncExternalStore` requires.
  const readers = useMemo(() => {
    const store = createEditorStore(editor);
    // The cache is a discriminated union so the `cached` branch carries
    // a typed value without an `as` cast or non-null assertion.
    type SnapshotCache = { kind: "empty" } | { kind: "cached"; value: T };
    const cache: { current: SnapshotCache } = { current: { kind: "empty" } };

    // Memoise the `{ editor, transaction }` snapshot object keyed on the
    // store's version counter. The object identity must stay stable
    // across `getSnapshot` reads that report no new notification;
    // rebuilding it on every read would force every selector that
    // closes over the snapshot to recompute even when nothing changed.
    // The version counter advances exactly once per `transaction` /
    // `selectionUpdate`, which is the only moment the transaction
    // payload changes — so keying the snapshot on the version mirrors
    // the existing `useMemo([editor])` editor-identity stability and
    // keeps the `useSyncExternalStore` equality short-circuit intact
    // under concurrent rendering.
    type SnapshotMemo = { version: number; snapshot: VizelEditorSnapshot };
    const snapshotMemo: { current: SnapshotMemo | null } = { current: null };

    const readSnapshot = (): VizelEditorSnapshot => {
      const version = store.getSnapshot();
      const memo = snapshotMemo.current;
      if (memo !== null && memo.version === version) {
        return memo.snapshot;
      }
      const snapshot: VizelEditorSnapshot = { editor, transaction: store.getTransaction() };
      snapshotMemo.current = { version, snapshot };
      return snapshot;
    };

    const getClientSnapshot = (): T => {
      // `getSnapshot` runs each time React reads from the store. The
      // selector executes against the version-keyed snapshot; the cached
      // previous value short-circuits when `equalityFn` declares the
      // slice unchanged so consumers can rely on `Object.is` against the
      // hook's return value.
      const next = selectorRef.current(readSnapshot());
      const previous = cache.current;
      if (previous.kind === "cached" && equalityRef.current(previous.value, next)) {
        return previous.value;
      }
      cache.current = { kind: "cached", value: next };
      return next;
    };

    const getServerSnapshot = (): T =>
      // React calls `getServerSnapshot` during server rendering, where
      // the editor has not yet mounted. The selector receives the
      // absence snapshot so the consumer observes the same shape as the
      // first browser render before mount completes.
      selectorRef.current({ editor: null, transaction: null });

    return { subscribe: store.subscribe, getClientSnapshot, getServerSnapshot };
  }, [editor]);

  return useSyncExternalStore(
    readers.subscribe,
    readers.getClientSnapshot,
    readers.getServerSnapshot
  );
}

export { shallowEqualArray, shallowEqualObject };
