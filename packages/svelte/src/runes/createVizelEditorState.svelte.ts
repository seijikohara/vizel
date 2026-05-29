import type { Editor } from "@vizel/core";
import { createSubscriber } from "svelte/reactivity";
import { getVizelContextSafe } from "../components/VizelContext.js";

// Derive Tiptap's `Transaction` type without importing `@tiptap/pm`
// directly. `Editor.state.tr` returns a fresh `Transaction` instance,
// so indexed access carries the type without expanding Svelte's
// declared dependency surface. `@vizel/core` already peers `@tiptap/pm`
// transitively, so the value is available at runtime in every consumer.
type VizelTransaction = Editor["state"]["tr"];

/**
 * Snapshot delivered to a {@link createVizelEditorState} selector on
 * every re-evaluation. Mirrors the React adapter's `_reactivity` shape
 * (ADR-0009) so cross-framework selector code stays portable.
 */
export interface VizelEditorStateSnapshot {
  /** Current editor instance, or `null` before mount and during SSR. */
  readonly editor: Editor | null;
  /** Latest Tiptap transaction, or `null` before the first one fires. */
  readonly transaction: VizelTransaction | null;
}

/**
 * Optional configuration for {@link createVizelEditorState}.
 */
export interface CreateVizelEditorStateOptions<T> {
  /**
   * Equality comparator used to short-circuit `current` updates.
   * Defaults to `Object.is`; supply a custom comparator (for example,
   * `shallowEqualArray`) when the selector projects to a structurally
   * compared value.
   */
  equalityFn?: (a: T, b: T) => boolean;
}

/**
 * Selector-style editor-state rune. Returns the projection of the
 * latest editor snapshot through `selector`, re-evaluated on every
 * Tiptap `transaction` and `selectionUpdate`.
 *
 * Behavior:
 * - Resolves the editor from {@link getVizelContextSafe}, so consumers
 *   never thread the editor instance manually through props.
 * - Subscribes through `createSubscriber` so the listeners attach
 *   exactly once per consumer effect and detach when every consumer
 *   tears down. The teardown closure detaches `transaction` and
 *   `selectionUpdate` listeners atomically.
 * - Skips re-emission whenever `equalityFn(prev, next)` returns true,
 *   which keeps fine-grained derived computations from re-running on
 *   no-op transactions (such as IME composition heartbeats).
 * - Is SSR-safe: the listener-attach effect runs only when the editor
 *   becomes non-null, and the first `current` read against an
 *   uninitialised editor evaluates the selector against
 *   `{ editor: null, transaction: null }` so server-rendered markup
 *   matches the client's first paint.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createVizelEditorState } from "@vizel/svelte";
 *
 *   // Track only character count; bold toggles do not re-render the badge.
 *   const characters = createVizelEditorState(
 *     ({ editor }) => editor?.storage.characterCount?.characters() ?? 0,
 *   );
 * </script>
 *
 * <span>{characters.current} characters</span>
 * ```
 */
export function createVizelEditorState<T>(
  selector: (snapshot: VizelEditorStateSnapshot) => T,
  options: CreateVizelEditorStateOptions<T> = {}
): { readonly current: T } {
  const equalityFn = options.equalityFn ?? Object.is;
  // The accessor is `null` outside a `<VizelProvider>`; the rune still
  // returns a working `{ current }` so consumers can mount before the
  // provider does without crashing.
  const accessor = getVizelContextSafe();

  // Latest transaction observed by the listener, paired with the
  // editor that produced it. The `editor` pairing prevents a stale
  // read after the provider swaps editors: without it, a transaction
  // from editor A leaks into the first selector evaluation for editor
  // B (or for `null`), giving the selector an internally inconsistent
  // snapshot (`editor: B, transaction: A.tr`).
  const latest: { editor: Editor | null; transaction: VizelTransaction | null } = {
    editor: null,
    transaction: null,
  };

  // Re-derive the subscriber for each distinct editor identity. Because
  // `createSubscriber` only invokes its `start` callback the first time
  // a consumer subscribes, a single subscriber wouldn't re-attach
  // listeners when `<VizelProvider editor>` swaps from `null` to an
  // instance after mount. Keying the subscriber on the editor reference
  // gives every editor its own subscription lifecycle while still
  // letting `createSubscriber` count consumers and run cleanup exactly
  // once per editor swap.
  const subscriberCache = new WeakMap<Editor, () => void>();
  const subscribeFor = (editor: Editor): (() => void) => {
    const existing = subscriberCache.get(editor);
    if (existing) return existing;
    const subscribe = createSubscriber((update) => {
      const handler = (event: { editor: Editor; transaction: VizelTransaction }): void => {
        // Pair the transaction with its source editor so the next
        // selector evaluation can detect — and discard — a stale
        // transaction from a previous editor identity.
        latest.editor = event.editor;
        latest.transaction = event.transaction;
        update();
      };
      // `selectionUpdate` does not carry a transaction; reuse the most
      // recent one so selector callers see a stable reference.
      const selectionHandler = (): void => update();
      editor.on("transaction", handler);
      editor.on("selectionUpdate", selectionHandler);
      return () => {
        editor.off("transaction", handler);
        editor.off("selectionUpdate", selectionHandler);
      };
    });
    subscriberCache.set(editor, subscribe);
    return subscribe;
  };

  // Cache the last selector return so `equalityFn` can short-circuit
  // re-emission. `hasPrevious` distinguishes "never run" from "ran and
  // returned `undefined`", which `Object.is` treats identically.
  const cache: { hasPrevious: boolean; previous: T } = {
    hasPrevious: false,
    previous: undefined as unknown as T,
  };

  const current = $derived.by(() => {
    // Register dependency on the editor accessor first so swapping a
    // `<VizelProvider editor>` value re-runs the selector even before
    // the first transaction lands.
    const editor = accessor?.current ?? null;
    if (editor) {
      // Calling `subscribe()` inside a tracking scope registers the
      // dependency on the subscription's version counter and triggers
      // listener attach for this editor.
      subscribeFor(editor)();
    }

    // Discard the previously cached transaction when the editor
    // identity changes (including the swap to `null`). The pairing
    // guards against an inconsistent first snapshot for the new
    // identity that would otherwise carry the old editor's
    // transaction reference.
    if (latest.editor !== editor) {
      latest.editor = editor;
      latest.transaction = null;
    }

    const snapshot: VizelEditorStateSnapshot = {
      editor,
      transaction: latest.transaction,
    };
    const next = selector(snapshot);

    if (cache.hasPrevious && equalityFn(cache.previous, next)) {
      return cache.previous;
    }
    cache.hasPrevious = true;
    cache.previous = next;
    return next;
  });

  return {
    get current() {
      return current;
    },
  };
}
