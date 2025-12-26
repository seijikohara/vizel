import type { Editor } from "@vizel/core";
import { useEffect, useReducer } from "react";

/**
 * Hook that forces a re-render whenever the editor's state changes.
 * This is useful for components that need to reflect the current editor state
 * (e.g., toolbar buttons that show active state).
 *
 * @param editor - The editor instance to subscribe to
 * @returns A number that changes on each editor state update (can be ignored)
 *
 * @example
 * ```tsx
 * function Toolbar({ editor }: { editor: Editor }) {
 *   useEditorState(editor);
 *   // Now editor.isActive() will be re-evaluated on each state change
 *   return (
 *     <button className={editor.isActive("bold") ? "active" : ""}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useEditorState(editor: Editor | null): number {
  const [updateCount, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;

    // Subscribe to transaction events to detect state changes
    const handleTransaction = () => {
      forceUpdate();
    };

    editor.on("transaction", handleTransaction);

    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor]);

  return updateCount;
}
