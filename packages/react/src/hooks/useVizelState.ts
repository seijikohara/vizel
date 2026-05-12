import type { Editor } from "@vizel/core";
import { useCallback, useSyncExternalStore } from "react";

const NO_TICK = 0;
const NO_OP_SUBSCRIBE = () => () => {
  /* no-op unsubscribe when editor is null */
};
const NO_OP_SNAPSHOT = () => NO_TICK;

/**
 * Hook that forces a re-render whenever the editor's state changes.
 *
 * This is useful for components that need to reflect the current editor state
 * (e.g., formatting buttons that show active state). Backed by
 * `useSyncExternalStore` so React 18+ concurrent rendering does not tear the
 * subscription state.
 *
 * @param editor - The editor instance (or `null` while it is still initializing)
 * @returns A monotonically increasing transaction tick (typically ignored)
 *
 * @example
 * ```tsx
 * function FormattingButtons({ editor }: { editor: Editor }) {
 *   useVizelState(editor);
 *   // Now editor.isActive() will be re-evaluated on each state change
 *   return (
 *     <button className={editor.isActive("bold") ? "active" : ""}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useVizelState(editor: Editor | null | undefined): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editor) {
        return () => {
          /* no-op unsubscribe */
        };
      }
      editor.on("transaction", onStoreChange);
      return () => {
        editor.off("transaction", onStoreChange);
      };
    },
    [editor]
  );

  // The snapshot returns the editor's transaction count when available so
  // identical-content re-renders return identical numbers (preventing
  // useSyncExternalStore from looping).
  const getSnapshot = useCallback(
    () => (editor ? (editor.view?.state.tr.time ?? NO_TICK) : NO_TICK),
    [editor]
  );

  return useSyncExternalStore(
    editor ? subscribe : NO_OP_SUBSCRIBE,
    editor ? getSnapshot : NO_OP_SNAPSHOT,
    editor ? getSnapshot : NO_OP_SNAPSHOT
  );
}
