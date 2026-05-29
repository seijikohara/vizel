import { type Editor, mountVizelEditorView } from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelEditorProps {
  /**
   * Forwarded ref to the editable container element.
   *
   * The ref resolves to the rendered `<div>`. React 19 treats `ref` as a
   * regular prop, so the consumer passes a standard `Ref<HTMLDivElement>` and
   * reads the element directly. To reach the editor instance, call
   * `useVizelEditor` or `useVizelContext` rather than routing the editor
   * through this ref (ADR-0004).
   */
  ref?: Ref<HTMLDivElement>;
  /** Editor instance. Falls back to the editor from `VizelProvider` / `Vizel` context if omitted. */
  editor?: Editor | null;
  /** Optional className for the editor container */
  className?: string;
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
 * // With a ref to read the container DOM element
 * const containerRef = useRef<HTMLDivElement>(null);
 * <VizelEditor ref={containerRef} editor={editor} />
 * ```
 */
export function VizelEditor({ ref, editor: editorProp, className }: VizelEditorProps): ReactNode {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  // Keep a private container ref the mount effect can read. The forwarded
  // `ref` may be a callback or an object ref, so the component cannot read
  // `.current` off it directly; the callback ref below fans the node out to
  // both targets.
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setContainer = useCallback(
    (node: HTMLDivElement | null): void => {
      containerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!(editor && container)) return;
    return mountVizelEditorView(editor, container);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return <div ref={setContainer} className={className} data-vizel-content="" />;
}
