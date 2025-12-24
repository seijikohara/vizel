import type { Editor } from "@vizel/core";
import { createContext, type ReactNode, useContext } from "react";

interface EditorContextValue {
  editor: Editor | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export interface EditorProviderProps {
  editor: Editor | null;
  children: ReactNode;
}

/**
 * Provider component that makes the editor instance available to child components.
 */
export function EditorProvider({ editor, children }: EditorProviderProps) {
  return <EditorContext.Provider value={{ editor }}>{children}</EditorContext.Provider>;
}

/**
 * Hook to access the editor instance from context.
 *
 * @throws Error if used outside of EditorProvider
 *
 * @example
 * ```tsx
 * function Toolbar() {
 *   const { editor } = useEditorContext();
 *   if (!editor) return null;
 *
 *   return (
 *     <button onClick={() => editor.chain().focus().toggleBold().run()}>
 *       Bold
 *     </button>
 *   );
 * }
 * ```
 */
export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);
  if (context === null) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}

/**
 * Hook to access the editor instance from context.
 * Returns null if used outside of EditorProvider (does not throw).
 */
export function useEditorContextSafe(): EditorContextValue | null {
  return useContext(EditorContext);
}
