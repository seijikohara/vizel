import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";
import { VizelInternalProvider } from "./VizelContext.tsx";

export interface VizelProviderProps {
  /** The editor instance from useVizelEditor */
  editor: Editor | null;
  /** Child components (VizelEditor, VizelBubbleMenu, etc.) */
  children: ReactNode;
  /** Optional className for the root container */
  className?: string;
}

/**
 * Provider component for the Vizel editor.
 * Provides editor context to all child components.
 *
 * @example
 * ```tsx
 * const editor = useVizelEditor();
 *
 * return (
 *   <VizelProvider editor={editor}>
 *     <VizelEditor />
 *     <VizelBubbleMenu />
 *   </VizelProvider>
 * );
 * ```
 */
export function VizelProvider({ editor, children, className }: VizelProviderProps) {
  return (
    <VizelInternalProvider editor={editor}>
      <div className={className} data-vizel-root="">
        {children}
      </div>
    </VizelInternalProvider>
  );
}
