import type { Editor } from "@tiptap/core";
import { getVizelEditorState, type VizelEditorState } from "@vizel/core";
import { useMemo } from "react";
import { useVizelState } from "./useVizelState.ts";

/**
 * Hook that returns the current editor state and re-renders on state changes.
 * This is a convenience hook that combines `useVizelState` (for reactivity)
 * and `getVizelEditorState` (for state extraction).
 *
 * @param getEditor - A function that returns the editor instance to observe
 * @returns The current editor state including focus, empty status, undo/redo, and character/word counts
 *
 * @example
 * ```tsx
 * function StatusBar({ editor }: { editor: Editor | null }) {
 *   const { characterCount, wordCount, canUndo, canRedo } = useVizelEditorState(() => editor);
 *
 *   return (
 *     <div className="status-bar">
 *       <span>{characterCount} characters</span>
 *       <span>{wordCount} words</span>
 *       <button disabled={!canUndo}>Undo</button>
 *       <button disabled={!canRedo}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVizelEditorState(getEditor: () => Editor | null | undefined): VizelEditorState {
  // Subscribe to editor state changes for reactivity
  const updateCount = useVizelState(getEditor);
  const editor = getEditor() ?? null;

  // Memoize the state extraction to avoid unnecessary recalculations
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateCount triggers recalculation on state changes
  return useMemo(() => getVizelEditorState(editor), [editor, updateCount]);
}
