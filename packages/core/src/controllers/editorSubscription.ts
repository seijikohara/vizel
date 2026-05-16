import type { Editor } from "@tiptap/core";

/**
 * Editor event names that {@link createVizelEditorSubscription} can attach to.
 *
 * Matches a subset of Tiptap's `EditorEvents` keys — limited to the events
 * Vizel itself observes via this helper.
 */
export type VizelEditorEventName = "update" | "transaction" | "selectionUpdate";

/**
 * Options for {@link createVizelEditorSubscription}.
 */
export interface VizelEditorSubscriptionOptions {
  /** Lazy editor accessor. Re-read on every subscription refresh. */
  getEditor: () => Editor | null | undefined;
  /** Event to attach the listener to. */
  event: VizelEditorEventName;
  /** Listener body. */
  handler: () => void;
  /**
   * If true, the handler is invoked once synchronously after the
   * subscription attaches (when the editor is available). Useful for
   * "initial load + update" patterns. Default: false.
   */
  fireImmediately?: boolean;
}

/**
 * Attach an editor event listener with a clean disposer.
 *
 * Captures the editor reference at subscription time. If the editor is
 * `null`/`undefined` when the function is called, the helper returns a
 * no-op disposer without attaching anything. Framework adapters call this
 * inside their effect primitive and pass the disposer as cleanup.
 *
 * @returns A disposer that detaches the listener.
 */
export function createVizelEditorSubscription(options: VizelEditorSubscriptionOptions): () => void {
  const { getEditor, event, handler, fireImmediately = false } = options;
  const editor = getEditor();
  if (!editor) {
    return () => {
      /* no-op when editor is unavailable at subscription time */
    };
  }
  editor.on(event, handler);
  if (fireImmediately) {
    handler();
  }
  return () => {
    editor.off(event, handler);
  };
}
