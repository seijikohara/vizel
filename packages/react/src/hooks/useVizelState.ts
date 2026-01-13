import type { Editor } from "@vizel/core";
import { useEffect, useReducer, useRef } from "react";

/**
 * Hook that forces a re-render whenever the editor's state changes.
 * This is useful for components that need to reflect the current editor state
 * (e.g., formatting buttons that show active state).
 *
 * @param getEditor - A function that returns the editor instance
 * @returns A number that changes on each editor state update (can be ignored)
 *
 * @example
 * ```tsx
 * function FormattingButtons({ editor }: { editor: Editor }) {
 *   useVizelState(() => editor);
 *   // Now editor.isActive() will be re-evaluated on each state change
 *   return (
 *     <button className={editor.isActive("bold") ? "active" : ""}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useVizelState(getEditor: () => Editor | null | undefined): number {
  const [updateCount, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    const editor = getEditor() ?? null;

    // Unsubscribe from previous editor if different
    if (editorRef.current && editorRef.current !== editor) {
      editorRef.current.off("transaction", forceUpdate);
    }

    editorRef.current = editor;

    if (!editor) return;

    // Subscribe to transaction events to detect state changes
    editor.on("transaction", forceUpdate);

    return () => {
      editor.off("transaction", forceUpdate);
    };
  });

  return updateCount;
}
