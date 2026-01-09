import type { Editor } from "@tiptap/core";
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { VizelBubbleMenuDefault } from "./VizelBubbleMenuDefault.tsx";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelBubbleMenuProps {
  /** Override the editor from context */
  editor?: Editor | null;
  /** Custom class name for the menu container */
  className?: string;
  /** Custom menu items (overrides default menu) */
  children?: ReactNode;
  /** Whether to show the default formatting menu */
  showDefaultMenu?: boolean;
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
 * // Basic usage with default menu
 * <VizelProvider editor={editor}>
 *   <VizelEditor />
 *   <VizelBubbleMenu />
 * </VizelProvider>
 *
 * // With custom items using sub-components
 * <VizelBubbleMenu>
 *   <VizelBubbleMenuButton
 *     onClick={() => editor.chain().toggleBold().run()}
 *     isActive={editor.isActive("bold")}
 *   >
 *     Bold
 *   </VizelBubbleMenuButton>
 *   <VizelBubbleMenuDivider />
 *   <VizelBubbleMenuButton onClick={() => setShowLinkEditor(true)}>
 *     Link
 *   </VizelBubbleMenuButton>
 * </VizelBubbleMenu>
 * ```
 */
export function VizelBubbleMenu({
  editor: editorProp,
  className,
  children,
  showDefaultMenu = true,
  pluginKey = "vizelBubbleMenu",
  updateDelay = 100,
  shouldShow,
  enableEmbed,
}: VizelBubbleMenuProps) {
  const context = useVizelContextSafe();
  const editor = editorProp ?? context?.editor ?? null;
  const menuRef = useRef<HTMLDivElement>(null);

  // Store shouldShow in ref to avoid recreating plugin when callback changes
  const shouldShowRef = useRef(shouldShow);
  shouldShowRef.current = shouldShow;

  useEffect(() => {
    if (!(editor && menuRef.current)) {
      return;
    }

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuRef.current,
      updateDelay,
      ...(shouldShowRef.current && {
        shouldShow: ({ editor: e, from, to }) =>
          shouldShowRef.current?.({ editor: e as Editor, from, to }) ?? false,
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
  }, [editor, pluginKey, updateDelay]);

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
        (showDefaultMenu && (
          <VizelBubbleMenuDefault editor={editor} {...(enableEmbed ? { enableEmbed } : {})} />
        ))}
    </div>
  );
}
