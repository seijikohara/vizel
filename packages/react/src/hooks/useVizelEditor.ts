import {
  createVizelEditorInstance,
  type Editor,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
  wrapAsVizelError,
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

  // Create editor on mount (async - optional dependencies are loaded dynamically)
  useEffect(() => {
    const opts = optionsRef.current;
    let isMounted = true;
    let editorInstance: Editor | null = null;

    void (async () => {
      try {
        const result = await createVizelEditorInstance({
          ...opts.editorOptions,
          ...(opts.features !== undefined && { features: opts.features }),
          extensions: opts.additionalExtensions,
          createSlashMenuRenderer: createVizelSlashMenuRenderer,
        });

        if (!isMounted) {
          result.editor.destroy();
          return;
        }

        editorInstance = result.editor;
        setEditor(result.editor);
      } catch (error) {
        const vizelError = wrapAsVizelError(error, {
          context: "Editor initialization failed",
          code: "EDITOR_INIT_FAILED",
        });
        opts.editorOptions.onError?.(vizelError);
        throw vizelError;
      }
    })();

    return () => {
      isMounted = false;
      editorInstance?.destroy();
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
