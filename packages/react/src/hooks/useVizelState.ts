import type { Editor } from "@vizel/core";
import { useCallback, useRef, useSyncExternalStore } from "react";

const noSubscribe = () => () => {
  /* no-op when editor is null */
};
const noSnapshot = () => 0;

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
  // A stable tick counter incremented by the subscribe callback. Reading
  // anything off `editor.view` here would either return a fresh object every
  // call (state.tr) or throw before mount, breaking useSyncExternalStore's
  // referential-stability contract and triggering an infinite render loop.
  const tickRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!editor) {
        return () => {
          /* no-op unsubscribe */
        };
      }
      const handler = () => {
        tickRef.current = (tickRef.current + 1) | 0;
        onStoreChange();
      };
      editor.on("transaction", handler);
      return () => {
        editor.off("transaction", handler);
      };
    },
    [editor]
  );

  const getSnapshot = useCallback(() => tickRef.current, []);

  return useSyncExternalStore(
    editor ? subscribe : noSubscribe,
    editor ? getSnapshot : noSnapshot,
    editor ? getSnapshot : noSnapshot
  );
}
