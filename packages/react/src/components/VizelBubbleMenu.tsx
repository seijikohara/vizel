import {
  BubbleMenuPlugin,
  createVizelBubbleMenuEscapeController,
  type Editor,
  type VizelLocale,
} from "@vizel/core";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { VizelBubbleMenuDefault } from "./VizelBubbleMenuDefault.tsx";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelBubbleMenuProps {
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
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
  /** Locale for translated UI strings */
  locale?: VizelLocale;
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
  locale,
}: VizelBubbleMenuProps) {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  const menuRef = useRef<HTMLDivElement>(null);

  // Store shouldShow in a ref so the plugin closure always reads the latest
  // callback without re-registering when the parent passes a new function
  // identity. The assignment runs inside a `useEffect` (not at render time)
  // to honor React's "no side effects during render" contract. The
  // one-tick lag between a re-render and the ref update is fine because
  // the closure only fires on subsequent ProseMirror events.
  const shouldShowRef = useRef(shouldShow);
  useEffect(() => {
    shouldShowRef.current = shouldShow;
  }, [shouldShow]);

  // Re-register the plugin when `shouldShow` toggles between `undefined`
  // and a function: if the prop transitions from `undefined` → defined,
  // the wrapper has to be installed once. If it transitions from
  // defined → `undefined`, the previously installed wrapper would keep
  // calling `shouldShowRef.current?.(...) ?? false` (always `false`) and
  // hide the menu forever. Comparing presence (not identity) so identity
  // changes of a continuously-defined callback still flow through the
  // ref without re-registering.
  const hasShouldShow = shouldShow !== undefined;

  useEffect(() => {
    if (!(editor && menuRef.current)) {
      return;
    }

    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element: menuRef.current,
      updateDelay,
      ...(hasShouldShow && {
        shouldShow: ({ editor: e, from, to }) =>
          shouldShowRef.current?.({ editor: e, from, to }) ?? false,
      }),
      options: {
        placement: "top",
      },
    });

    editor.registerPlugin(plugin);

    // Escape collapses the selection so the bubble menu hides on its own
    // shouldShow predicate. The listener lives in a Core controller so
    // this component does not call `document.addEventListener` directly.
    const escapeController = createVizelBubbleMenuEscapeController({
      getEditor: () => editor,
    });
    escapeController.mount();

    return () => {
      editor.unregisterPlugin(pluginKey);
      escapeController.unmount();
    };
  }, [editor, pluginKey, updateDelay, hasShouldShow]);

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`vizel-bubble-menu ${className ?? ""}`}
      data-vizel-bubble-menu=""
      role="toolbar"
      aria-label={locale?.bubbleMenu?.ariaLabel ?? "Text formatting"}
      style={{ visibility: "hidden" }}
    >
      {children ??
        (showDefaultMenu && (
          <VizelBubbleMenuDefault
            editor={editor}
            {...(enableEmbed ? { enableEmbed } : {})}
            {...(locale ? { locale } : {})}
          />
        ))}
    </div>
  );
}
