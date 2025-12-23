import { EditorContent as TiptapEditorContent } from "@tiptap/react";
import { useEditorContext } from "./EditorContext.tsx";
import type { Editor } from "@vizel/core";

export interface EditorContentProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Optional className for the editor container */
  className?: string;
}

/**
 * Renders the editable content area of the Vizel editor.
 *
 * Must be used within an EditorRoot, or you can pass the editor directly.
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
  const context = useEditorContext();
  const editor = editorProp ?? context.editor;

  if (!editor) {
    return null;
  }

  return (
    <TiptapEditorContent
      editor={editor}
      className={className}
      data-vizel-content=""
    />
  );
}
