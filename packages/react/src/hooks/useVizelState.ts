import type { Editor } from "@vizel/core";
import { useEffect, useReducer } from "react";

/**
 * Hook that forces a re-render whenever the editor's state changes.
 * This is useful for components that need to reflect the current editor state
 * (e.g., formatting buttons that show active state).
 *
 * @param editor - The editor instance (or `null` while it is still initializing)
 * @returns A number that changes on each editor state update (can be ignored)
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
  const [updateCount, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;

    editor.on("transaction", forceUpdate);

    return () => {
      editor.off("transaction", forceUpdate);
    };
  }, [editor]);

  return updateCount;
}
