import type { Editor } from "@vizel/core";
import { useState } from "react";
import { useEditorState } from "../hooks/useEditorState.ts";
import { BubbleMenuButton } from "./BubbleMenuButton.tsx";
import { BubbleMenuColorPicker } from "./BubbleMenuColorPicker.tsx";
import { BubbleMenuLinkEditor } from "./BubbleMenuLinkEditor.tsx";
import { Icon } from "./Icon.tsx";
import { NodeSelector } from "./NodeSelector.tsx";

export interface BubbleMenuToolbarProps {
  editor: Editor;
  className?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
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
export function BubbleMenuToolbar({ editor, className, enableEmbed }: BubbleMenuToolbarProps) {
  // Subscribe to editor state changes to update active states
  useEditorState(editor);
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  if (showLinkEditor) {
    return (
      <BubbleMenuLinkEditor
        editor={editor}
        onClose={() => setShowLinkEditor(false)}
        {...(enableEmbed ? { enableEmbed } : {})}
      />
    );
  }

  return (
    <div className={`vizel-bubble-menu-toolbar ${className ?? ""}`}>
      <NodeSelector editor={editor} />
      <BubbleMenuButton
        action="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <Icon name="bold" />
      </BubbleMenuButton>
      <BubbleMenuButton
        action="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <Icon name="italic" />
      </BubbleMenuButton>
      <BubbleMenuButton
        action="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Icon name="strikethrough" />
      </BubbleMenuButton>
      <BubbleMenuButton
        action="underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Cmd+U)"
      >
        <Icon name="underline" />
      </BubbleMenuButton>
      <BubbleMenuButton
        action="code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <Icon name="code" />
      </BubbleMenuButton>
      <BubbleMenuButton
        action="link"
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <Icon name="link" />
      </BubbleMenuButton>
      <BubbleMenuColorPicker editor={editor} type="textColor" />
      <BubbleMenuColorPicker editor={editor} type="highlight" />
    </div>
  );
}
