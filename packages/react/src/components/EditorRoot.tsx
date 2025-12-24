import type { Editor } from "@vizel/core";
import type { ReactNode } from "react";
import { EditorProvider } from "./EditorContext.tsx";

export interface EditorRootProps {
  /** The editor instance from useVizelEditor */
  editor: Editor | null;
  /** Child components (EditorContent, BubbleMenu, etc.) */
  children: ReactNode;
  /** Optional className for the root container */
  className?: string;
}

/**
 * Root component for the Vizel editor.
 * Provides editor context to all child components.
 *
 * @example
 * ```tsx
 * const editor = useVizelEditor();
 *
 * return (
 *   <EditorRoot editor={editor}>
 *     <EditorContent />
 *   </EditorRoot>
 * );
 * ```
 */
export function EditorRoot({ editor, children, className }: EditorRootProps) {
  return (
    <EditorProvider editor={editor}>
      <div className={className} data-vizel-root="">
        {children}
      </div>
    </EditorProvider>
  );
}
