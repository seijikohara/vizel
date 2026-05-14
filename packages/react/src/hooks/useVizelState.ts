import { createVizelEditorTransactionStore, type Editor } from "@vizel/core";
import { useMemo, useSyncExternalStore } from "react";

const noSubscribe = () => () => {
  /* no-op when editor is null */
};
const noSnapshot = () => 0;

/**
 * Hook that forces a re-render whenever the editor's state changes.
 *
 * This is useful for components that need to reflect the current editor
 * state (e.g., formatting buttons that show active state). Backed by
 * `useSyncExternalStore` plus `createVizelEditorTransactionStore` from
 * `@vizel/core` so the subscription and version tracking are shared with
 * the Vue and Svelte adapters.
 *
 * @param editor - The editor instance (or `null` while it is still initializing)
 * @returns A monotonically increasing transaction tick (typically ignored)
 *
 * @example
 * ```tsx
 * function FormattingButtons({ editor }: { editor: Editor }) {
 *   useVizelState(editor);
 *   return (
 *     <button className={editor.isActive("bold") ? "active" : ""}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useVizelState(editor: Editor | null | undefined): number {
  const store = useMemo(
    () => (editor ? createVizelEditorTransactionStore(() => editor) : null),
    [editor]
  );

  return useSyncExternalStore(
    store ? store.subscribe : noSubscribe,
    store ? store.getVersion : noSnapshot,
    store ? store.getVersion : noSnapshot
  );
}
