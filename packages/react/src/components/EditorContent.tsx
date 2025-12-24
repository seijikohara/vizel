import { EditorContent as TiptapEditorContent } from "@tiptap/react";
import type { Editor } from "@vizel/core";
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

  if (!editor) {
    return null;
  }

  return <TiptapEditorContent editor={editor} className={className} data-vizel-content="" />;
}
