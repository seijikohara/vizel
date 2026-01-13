import type { Editor } from "@tiptap/core";
import {
  createVizelEditorInstance,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
} from "@vizel/core";
import { useEffect, useRef, useState } from "react";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.ts";

/**
 * Options for useVizelEditor hook.
 * @see VizelCreateEditorOptions for available options.
 */
export type UseVizelEditorOptions = VizelCreateEditorOptions;

/**
 * React hook to create and manage a Vizel editor instance.
 *
 * @example
 * ```tsx
 * const editor = useVizelEditor({
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getJSON());
 *   },
 * });
 *
 * return <EditorContent editor={editor} />;
 * ```
 *
 * @example
 * ```tsx
 * // With initial markdown content
 * const editor = useVizelEditor({
 *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
 * });
 * ```
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}): Editor | null {
  const { features, extensions: additionalExtensions = [], ...editorOptions } = options;

  const [editor, setEditor] = useState<Editor | null>(null);

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};
  const imageOptionsRef = useRef(imageOptions);
  imageOptionsRef.current = imageOptions;

  // Store options in ref to avoid recreating editor on every render
  const optionsRef = useRef({
    features,
    additionalExtensions,
    editorOptions,
  });

  // Create editor on mount
  useEffect(() => {
    const opts = optionsRef.current;

    const { editor: instance } = createVizelEditorInstance({
      ...opts.editorOptions,
      ...(opts.features !== undefined && { features: opts.features }),
      extensions: opts.additionalExtensions,
      createSlashMenuRenderer: createVizelSlashMenuRenderer,
    });

    setEditor(instance);

    return () => {
      instance.destroy();
    };
  }, []);

  // Handle vizel:upload-image custom event from slash command
  useEffect(() => {
    if (!editor) return;

    return registerVizelUploadEventHandler({
      getEditor: () => editor,
      getImageOptions: () => imageOptionsRef.current,
    });
  }, [editor]);

  return editor;
}
