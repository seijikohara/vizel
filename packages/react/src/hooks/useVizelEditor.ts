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
 * ## Reactive vs mount-time options
 *
 * The Tiptap editor instance is created once on mount. To avoid expensive
 * teardowns, most options are read once at mount and ignored on subsequent
 * renders. The following options are an exception:
 *
 * - `editable` — propagated through `editor.setEditable()` whenever the prop
 *   value changes.
 * - All `on*` callbacks (`onUpdate`, `onError`, etc.) — read through a ref
 *   each time they fire, so passing a fresh closure on every render is fine.
 *
 * Changing `initialContent`, `initialMarkdown`, `placeholder`, `features`,
 * `extensions`, `flavor`, `locale`, or `autofocus` after mount has no effect.
 * Use `editor.commands.setContent(...)` (or the corresponding feature command)
 * to update the document after mount.
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
 * return <VizelEditor editor={editor} />;
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
        const handler = opts.editorOptions.onError;
        if (handler) {
          // When a handler is supplied, the consumer has opted in to handling
          // the failure. Do not also rethrow; that turned the same error into
          // a console-noisy unhandled rejection right after the handler ran.
          handler(vizelError);
          return;
        }
        // Otherwise rethrow so global handlers (Sentry, unhandledrejection
        // listeners) can observe the initialization failure.
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

  // Mirror the `editable` prop into the underlying editor. The constructor
  // option is captured at mount; without this watcher consumers cannot
  // toggle read-only mode after the editor exists.
  const editable = editorOptions.editable ?? true;
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return editor;
}
