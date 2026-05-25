import { type Editor, mountVizelEditorView } from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelEditorProps {
  /** Ref to access editor container */
  ref?: Ref<VizelExposed>;
  /** Override the editor from context */
  editor?: Editor | null;
  /** Optional className for the editor container */
  className?: string;
}

export interface VizelExposed {
  /** The container DOM element */
  container: HTMLDivElement | null;
  /**
   * The Tiptap editor instance that this component is rendering.
   *
   * Mirrors whichever editor was resolved (explicit prop or context).
   * Lets callers skip the extra round-trip through `useVizelContext` or
   * lifting state when they only need imperative access to the editor.
   */
  editor: Editor | null;
}

/**
 * Renders the editable content area of the Vizel editor.
 *
 * Can be used within an VizelProvider (no editor prop needed), or standalone with editor prop.
 *
 * @example
 * ```tsx
 * // With VizelProvider
 * <VizelProvider editor={editor}>
 *   <VizelEditor className="prose" />
 * </VizelProvider>
 *
 * // Or directly with editor prop
 * <VizelEditor editor={editor} className="prose" />
 *
 * // With ref to access container DOM
 * const editorRef = useRef<VizelExposed>(null);
 * <VizelEditor ref={editorRef} editor={editor} />
 * // editorRef.current?.container gives you the container element
 * ```
 */
export function VizelEditor({ ref, editor: editorProp, className }: VizelEditorProps): ReactNode {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose container ref and editor instance via imperative handle. The
  // editor moves into the dependency list so consumers that read
  // `ref.current?.editor` after the editor resolves see the live value
  // instead of the `null` snapshot captured at first mount.
  useImperativeHandle(
    ref,
    () => ({
      container: containerRef.current,
      editor: editor ?? null,
    }),
    [editor]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!(editor && container)) return;
    return mountVizelEditorView(editor, container);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return <div ref={containerRef} className={className} data-vizel-content="" />;
}
