import { BubbleMenuPlugin, type Editor } from "@vizel/core";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { BubbleMenuToolbar } from "./BubbleMenuToolbar.tsx";
import { useEditorContextSafe } from "./EditorContext.tsx";

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
  shouldShow?: (props: { editor: Editor; from: number; to: number }) => boolean;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
}

/**
 * A floating menu that appears when text is selected.
 * Provides formatting options like bold, italic, strike, code, and link.
 *
 * @example
 * ```tsx
 * // Basic usage with default toolbar
 * <EditorRoot editor={editor}>
 *   <EditorContent />
 *   <BubbleMenu />
 * </EditorRoot>
 *
 * // With custom items using sub-components
 * <BubbleMenu>
 *   <BubbleMenuButton
 *     onClick={() => editor.chain().toggleBold().run()}
 *     isActive={editor.isActive("bold")}
 *   >
 *     Bold
 *   </BubbleMenuButton>
 *   <BubbleMenuDivider />
 *   <BubbleMenuButton onClick={() => setShowLinkEditor(true)}>
 *     Link
 *   </BubbleMenuButton>
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
  enableEmbed,
}: BubbleMenuProps) {
  const context = useEditorContextSafe();
  const editor = editorProp ?? context?.editor ?? null;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!(editor && menuRef.current)) {
      return;
    }

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuRef.current,
      updateDelay,
      ...(shouldShow && {
        shouldShow: ({ editor: e, from, to }) => shouldShow({ editor: e as Editor, from, to }),
      }),
      options: {
        placement: "top",
      },
    });

    editor.registerPlugin(plugin);

    // Handle Escape key to hide bubble menu by collapsing selection
    const currentEditor = editor;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !currentEditor.view.state.selection.empty) {
        event.preventDefault();
        currentEditor.commands.setTextSelection(currentEditor.view.state.selection.to);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      editor.unregisterPlugin(pluginKey);
      document.removeEventListener("keydown", handleKeyDown);
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
      {children ??
        (showDefaultToolbar && (
          <BubbleMenuToolbar editor={editor} {...(enableEmbed ? { enableEmbed } : {})} />
        ))}
    </div>
  );
}
