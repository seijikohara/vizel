import type { Editor } from "@tiptap/core";

/**
 * Framework-agnostic store that exposes editor transaction notifications.
 *
 * The store does not hold the transaction itself — Tiptap's `state.tr` is a
 * getter that returns a fresh `Transaction` on every read, which breaks
 * referential-equality based change detection (notably React's
 * `useSyncExternalStore`). Instead it tracks a monotonically increasing
 * version counter and lets framework adapters wire the change signal into
 * their reactivity primitive (`useState`, `ref`, `$state`, etc.).
 *
 * Subscribers are notified on every `transaction` event from the supplied
 * editor. Swapping the editor (via `getEditor` returning a different value
 * across subscribe calls) is supported transparently: each `subscribe`
 * binds against the editor that's current when it is called.
 */
export interface VizelEditorTransactionStore {
  /**
   * Register a callback fired on every editor transaction. Returns an
   * unsubscribe function that detaches the listener.
   */
  subscribe(onChange: () => void): () => void;
  /**
   * Read the current version counter. Increments by 1 (with 32-bit wrap-
   * around) on every transaction.
   */
  getVersion(): number;
}

/**
 * Create a {@link VizelEditorTransactionStore} that observes whichever
 * editor `getEditor` currently returns. The factory is framework-agnostic;
 * each framework wraps the store in its native reactivity primitive.
 *
 * @example
 * ```tsx
 * // React adapter via useSyncExternalStore:
 * const store = createVizelEditorTransactionStore(() => editor);
 * useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
 * ```
 */
export function createVizelEditorTransactionStore(
  getEditor: () => Editor | null | undefined
): VizelEditorTransactionStore {
  const state = { version: 0 };

  return {
    subscribe(onChange) {
      const editor = getEditor();
      if (!editor) {
        return () => {
          /* no-op unsubscribe when editor is null at subscribe time */
        };
      }
      const handler = () => {
        state.version = (state.version + 1) | 0;
        onChange();
      };
      editor.on("transaction", handler);
      return () => {
        editor.off("transaction", handler);
      };
    },
    getVersion() {
      return state.version;
    },
  };
}
