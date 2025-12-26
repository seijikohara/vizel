import type { Editor } from "@vizel/core";
import { useState } from "react";
import { useEditorState } from "../hooks/useEditorState.ts";
import { BubbleMenuButton } from "./BubbleMenuButton.tsx";
import { BubbleMenuColorPicker } from "./BubbleMenuColorPicker.tsx";
import { BubbleMenuLinkEditor } from "./BubbleMenuLinkEditor.tsx";

export interface BubbleMenuToolbarProps {
  editor: Editor;
  className?: string;
}

/**
 * The default toolbar component for the BubbleMenu.
 * Provides formatting buttons for bold, italic, strikethrough, code, and link.
 *
 * @example
 * ```tsx
 * <BubbleMenu>
 *   <BubbleMenuToolbar editor={editor} />
 * </BubbleMenu>
 * ```
 */
export function BubbleMenuToolbar({ editor, className }: BubbleMenuToolbarProps) {
  // Subscribe to editor state changes to update active states
  useEditorState(editor);
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  if (showLinkEditor) {
    return <BubbleMenuLinkEditor editor={editor} onClose={() => setShowLinkEditor(false)} />;
  }

  return (
    <div className={`vizel-bubble-menu-toolbar ${className ?? ""}`}>
      <BubbleMenuButton
        action="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </BubbleMenuButton>
      <BubbleMenuButton
        action="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </BubbleMenuButton>
      <BubbleMenuButton
        action="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <s>S</s>
      </BubbleMenuButton>
      <BubbleMenuButton
        action="underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Cmd+U)"
      >
        <u>U</u>
      </BubbleMenuButton>
      <BubbleMenuButton
        action="code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <code>&lt;/&gt;</code>
      </BubbleMenuButton>
      <BubbleMenuButton
        action="link"
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <span>L</span>
      </BubbleMenuButton>
      <BubbleMenuColorPicker editor={editor} type="textColor" />
      <BubbleMenuColorPicker editor={editor} type="highlight" />
    </div>
  );
}
