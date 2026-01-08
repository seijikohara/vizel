import type { Editor } from "@tiptap/core";
import { createContext, type ReactNode, useContext } from "react";

interface VizelContextValue {
  editor: Editor | null;
}

const VizelContext = createContext<VizelContextValue | null>(null);

export interface VizelInternalProviderProps {
  editor: Editor | null;
  children: ReactNode;
}

/**
 * Internal provider component that makes the editor instance available to child components.
 * @internal
 */
export function VizelInternalProvider({ editor, children }: VizelInternalProviderProps) {
  return <VizelContext.Provider value={{ editor }}>{children}</VizelContext.Provider>;
}

/**
 * Hook to access the editor instance from context.
 *
 * @throws Error if used outside of VizelProvider
 *
 * @example
 * ```tsx
 * function Toolbar() {
 *   const { editor } = useVizelContext();
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
export function useVizelContext(): VizelContextValue {
  const context = useContext(VizelContext);
  if (context === null) {
    throw new Error(
      "[Vizel] useVizelContext must be used within <VizelProvider> or <Vizel>.\n" +
        "Example:\n" +
        "  <VizelProvider editor={editor}>\n" +
        "    <YourComponent />\n" +
        "  </VizelProvider>"
    );
  }
  return context;
}

/**
 * Hook to access the editor instance from context.
 * Returns null if used outside of VizelProvider (does not throw).
 */
export function useVizelContextSafe(): VizelContextValue | null {
  return useContext(VizelContext);
}
