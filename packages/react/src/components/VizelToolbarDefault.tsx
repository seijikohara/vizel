import type { Editor } from "@tiptap/core";
import { useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelLinkEditor } from "./VizelLinkEditor.tsx";
import { VizelNodeSelector } from "./VizelNodeSelector.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarColorPicker } from "./VizelToolbarColorPicker.tsx";

export interface VizelToolbarDefaultProps {
  editor: Editor;
  className?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

/**
 * The default toolbar component for VizelToolbar.
 * Provides formatting buttons for bold, italic, strikethrough, code, and link.
 *
 * @example
 * ```tsx
 * <VizelToolbar>
 *   <VizelToolbarDefault editor={editor} />
 * </VizelToolbar>
 * ```
 */
export function VizelToolbarDefault({ editor, className, enableEmbed }: VizelToolbarDefaultProps) {
  // Subscribe to editor state changes to update active states
  useVizelState(editor);
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
      <VizelToolbarButton
        action="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <VizelIcon name="bold" />
      </VizelToolbarButton>
      <VizelToolbarButton
        action="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <VizelIcon name="italic" />
      </VizelToolbarButton>
      <VizelToolbarButton
        action="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <VizelIcon name="strikethrough" />
      </VizelToolbarButton>
      <VizelToolbarButton
        action="underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Cmd+U)"
      >
        <VizelIcon name="underline" />
      </VizelToolbarButton>
      <VizelToolbarButton
        action="code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <VizelIcon name="code" />
      </VizelToolbarButton>
      <VizelToolbarButton
        action="link"
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <VizelIcon name="link" />
      </VizelToolbarButton>
      <VizelToolbarColorPicker editor={editor} type="textColor" />
      <VizelToolbarColorPicker editor={editor} type="highlight" />
    </div>
  );
}
