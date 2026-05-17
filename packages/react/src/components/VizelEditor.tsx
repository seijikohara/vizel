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

  // Expose container ref via imperative handle
  useImperativeHandle(
    ref,
    () => ({
      container: containerRef.current,
    }),
    []
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
