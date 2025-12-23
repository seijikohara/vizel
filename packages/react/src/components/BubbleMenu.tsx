import { useState, useCallback, useEffect, useRef } from "react";
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import { useEditorContextSafe } from "./EditorContext.tsx";
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
  /** Plugin key for the bubble menu */
  pluginKey?: string;
  /** Delay in ms before updating the menu position */
  updateDelay?: number;
  /** Custom shouldShow function */
  shouldShow?: (props: {
    editor: Editor;
    from: number;
    to: number;
  }) => boolean;
}

interface ToolbarButtonProps {
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

interface LinkEditorProps {
  editor: Editor;
  onClose: () => void;
}

function LinkEditor({ editor, onClose }: LinkEditorProps) {
  const currentHref = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(currentHref);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (url.trim()) {
        editor.chain().focus().setLink({ href: url.trim() }).run();
      } else {
        editor.chain().focus().unsetLink().run();
      }
      onClose();
    },
    [editor, url, onClose]
  );

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  return (
    <form onSubmit={handleSubmit} className="vizel-link-editor">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
        className="vizel-link-input"
        autoFocus
      />
      <button type="submit" className="vizel-link-button" title="Apply">
        OK
      </button>
      {currentHref && (
        <button
          type="button"
          onClick={handleRemove}
          className="vizel-link-button vizel-link-remove"
          title="Remove link"
        >
          X
        </button>
      )}
    </form>
  );
}

function DefaultToolbar({ editor }: { editor: Editor }) {
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  if (showLinkEditor) {
    return <LinkEditor editor={editor} onClose={() => setShowLinkEditor(false)} />;
  }

  return (
    <>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Code (Cmd+E)"
      >
        <code>&lt;/&gt;</code>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => setShowLinkEditor(true)}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <span>L</span>
      </ToolbarButton>
    </>
  );
}

/**
 * A floating menu that appears when text is selected.
 * Provides formatting options like bold, italic, strike, code, and link.
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
  pluginKey = "vizelBubbleMenu",
  updateDelay = 100,
  shouldShow,
}: BubbleMenuProps) {
  const context = useEditorContextSafe();
  const editor = editorProp ?? context?.editor ?? null;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || !menuRef.current) {
      return;
    }

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuRef.current,
      updateDelay,
      shouldShow: shouldShow
        ? ({ editor: e, from, to }) => shouldShow({ editor: e as Editor, from, to })
        : undefined,
      options: {
        placement: "top",
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(pluginKey);
    };
  }, [editor, pluginKey, updateDelay, shouldShow]);

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`vizel-bubble-menu ${className ?? ""}`}
      data-vizel-bubble-menu=""
      style={{ visibility: "hidden" }}
    >
      {children ?? (showDefaultToolbar && <DefaultToolbar editor={editor} />)}
    </div>
  );
}
