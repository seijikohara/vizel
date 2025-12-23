import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react";
import { useEditorContext } from "./EditorContext.tsx";
import type { Editor } from "@vizel/core";
import type { ReactNode } from "react";

export interface BubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name for the menu container */
  className?: string;
  /** Custom menu items (overrides default toolbar) */
  children?: ReactNode;
  /** Whether to show the default formatting toolbar */
  showDefaultToolbar?: boolean;
}

interface ToolbarButtonProps {
  editor: Editor;
  onClick: () => void;
  isActive: boolean;
  children: ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`vizel-bubble-menu-button ${isActive ? "is-active" : ""}`}
      title={title}
      data-active={isActive || undefined}
    >
      {children}
    </button>
  );
}

function DefaultToolbar({ editor }: { editor: Editor }) {
  return (
    <>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <code>&lt;/&gt;</code>
      </ToolbarButton>
    </>
  );
}

/**
 * A floating menu that appears when text is selected.
 * Provides formatting options like bold, italic, strike, and code.
 *
 * @example
 * ```tsx
 * <EditorRoot editor={editor}>
 *   <EditorContent />
 *   <BubbleMenu />
 * </EditorRoot>
 *
 * // With custom items
 * <BubbleMenu>
 *   <button onClick={() => editor.chain().toggleBold().run()}>Bold</button>
 * </BubbleMenu>
 * ```
 */
export function BubbleMenu({
  editor: editorProp,
  className,
  children,
  showDefaultToolbar = true,
}: BubbleMenuProps) {
  const context = useEditorContext();
  const editor = editorProp ?? context.editor;

  if (!editor) {
    return null;
  }

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: "top",
      }}
      className={`vizel-bubble-menu ${className ?? ""}`}
      data-vizel-bubble-menu=""
    >
      {children ?? (showDefaultToolbar && <DefaultToolbar editor={editor} />)}
    </TiptapBubbleMenu>
  );
}
