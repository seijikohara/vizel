import { type Editor, formatVizelTooltip } from "@vizel/core";
import { useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelBubbleMenuButton } from "./VizelBubbleMenuButton.tsx";
import { VizelBubbleMenuColorPicker } from "./VizelBubbleMenuColorPicker.tsx";
import { VizelBubbleMenuDivider } from "./VizelBubbleMenuDivider.tsx";
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
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuButton
        action="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title={formatVizelTooltip("Bold", "Mod+B")}
      >
        <VizelIcon name="bold" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title={formatVizelTooltip("Italic", "Mod+I")}
      >
        <VizelIcon name="italic" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title={formatVizelTooltip("Strikethrough", "Mod+Shift+S")}
      >
        <VizelIcon name="strikethrough" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title={formatVizelTooltip("Underline", "Mod+U")}
      >
        <VizelIcon name="underline" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuButton
        action="code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title={formatVizelTooltip("Code", "Mod+E")}
      >
        <VizelIcon name="code" />
      </VizelBubbleMenuButton>
      {editor.extensionManager.extensions.some((ext) => ext.name === "superscript") && (
        <VizelBubbleMenuButton
          action="superscript"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive("superscript")}
          title="Superscript (Cmd+.)"
        >
          <VizelIcon name="superscript" />
        </VizelBubbleMenuButton>
      )}
      {editor.extensionManager.extensions.some((ext) => ext.name === "subscript") && (
        <VizelBubbleMenuButton
          action="subscript"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive("subscript")}
          title="Subscript (Cmd+,)"
        >
          <VizelIcon name="subscript" />
        </VizelBubbleMenuButton>
      )}
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuButton
        action="link"
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title={formatVizelTooltip("Link", "Mod+K")}
      >
        <VizelIcon name="link" />
      </VizelBubbleMenuButton>
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuColorPicker editor={editor} type="textColor" />
      <VizelBubbleMenuColorPicker editor={editor} type="highlight" />
    </div>
  );
}
