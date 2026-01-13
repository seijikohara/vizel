import type { Editor } from "@tiptap/core";
import { useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelBubbleMenuButton } from "./VizelBubbleMenuButton.tsx";
import { VizelBubbleMenuColorPicker } from "./VizelBubbleMenuColorPicker.tsx";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelLinkEditor } from "./VizelLinkEditor.tsx";
import { VizelNodeSelector } from "./VizelNodeSelector.tsx";

export interface VizelBubbleMenuDefaultProps {
  editor: Editor;
  className?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

/**
 * The default menu content for VizelBubbleMenu.
 * Provides formatting buttons for bold, italic, strikethrough, code, and link.
 *
 * @example
 * ```tsx
 * <VizelBubbleMenu>
 *   <VizelBubbleMenuDefault editor={editor} />
 * </VizelBubbleMenu>
 * ```
 */
export function VizelBubbleMenuDefault({
  editor,
  className,
  enableEmbed,
}: VizelBubbleMenuDefaultProps) {
  // Subscribe to editor state changes to update active states
  useVizelState(() => editor);
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  if (showLinkEditor) {
    return (
      <VizelLinkEditor
        editor={editor}
        onClose={() => setShowLinkEditor(false)}
        {...(enableEmbed ? { enableEmbed } : {})}
      />
    );
  }

  return (
    <div className={`vizel-bubble-menu-toolbar ${className ?? ""}`}>
      <VizelNodeSelector editor={editor} />
      <VizelBubbleMenuButton
        action="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <VizelIcon name="bold" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <VizelIcon name="italic" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <VizelIcon name="strikethrough" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Cmd+U)"
      >
        <VizelIcon name="underline" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <VizelIcon name="code" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="link"
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <VizelIcon name="link" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuColorPicker editor={editor} type="textColor" />
      <VizelBubbleMenuColorPicker editor={editor} type="highlight" />
    </div>
  );
}
