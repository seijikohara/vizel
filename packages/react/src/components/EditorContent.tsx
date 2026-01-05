import type { Editor } from "@vizel/core";
import { useEffect, useRef } from "react";
import { useEditorContextSafe } from "./EditorContext.tsx";

export interface EditorContentProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Optional className for the editor container */
  className?: string;
}

/**
 * Renders the editable content area of the Vizel editor.
 *
 * Can be used within an EditorRoot (no editor prop needed), or standalone with editor prop.
 *
 * @example
 * ```tsx
 * // With EditorRoot
 * <EditorRoot editor={editor}>
 *   <EditorContent className="prose" />
 * </EditorRoot>
 *
 * // Or directly with editor prop
 * <EditorContent editor={editor} className="prose" />
 * ```
 */
export function EditorContent({ editor: editorProp, className }: EditorContentProps) {
  const context = useEditorContextSafe();
  const editor = editorProp ?? context?.editor;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!(editor && container)) {
      return;
    }

    // Mount the editor's DOM view to the container element
    container.appendChild(editor.view.dom);

    // Update editable state
    editor.view.setProps({
      editable: () => editor?.isEditable ?? false,
    });

    // Cleanup: remove DOM element when editor changes or unmounts
    return () => {
      if (editor.view.dom.parentNode === container) {
        container.removeChild(editor.view.dom);
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return <div ref={containerRef} className={className} data-vizel-content="" />;
}
