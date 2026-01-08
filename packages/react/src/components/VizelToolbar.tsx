import type { Editor } from "@tiptap/core";
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";
import { VizelToolbarDefault } from "./VizelToolbarDefault.tsx";

export interface VizelToolbarProps {
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
 * A floating toolbar that appears when text is selected.
 * Provides formatting options like bold, italic, strike, code, and link.
 *
 * @example
 * ```tsx
 * // Basic usage with default toolbar
 * <VizelProvider editor={editor}>
 *   <VizelEditor />
 *   <VizelToolbar />
 * </VizelProvider>
 *
 * // With custom items using sub-components
 * <VizelToolbar>
 *   <VizelToolbarButton
 *     onClick={() => editor.chain().toggleBold().run()}
 *     isActive={editor.isActive("bold")}
 *   >
 *     Bold
 *   </VizelToolbarButton>
 *   <VizelToolbarDivider />
 *   <VizelToolbarButton onClick={() => setShowLinkEditor(true)}>
 *     Link
 *   </VizelToolbarButton>
 * </VizelToolbar>
 * ```
 */
export function VizelToolbar({
  editor: editorProp,
  className,
  children,
  showDefaultToolbar = true,
  pluginKey = "vizelBubbleMenu",
  updateDelay = 100,
  shouldShow,
  enableEmbed,
}: VizelToolbarProps) {
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
        (showDefaultToolbar && (
          <VizelToolbarDefault editor={editor} {...(enableEmbed ? { enableEmbed } : {})} />
        ))}
    </div>
  );
}
