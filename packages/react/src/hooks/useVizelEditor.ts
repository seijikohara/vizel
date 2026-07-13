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
 * renders. The single exception is `editable`, which is mirrored through
 * `editor.setEditable()` whenever the prop value changes.
 *
 * `on*` callbacks (`onUpdate`, `onError`, etc.) are also captured at mount,
 * matching Vue's `useVizelEditor` and Svelte's `createVizelEditor`. Passing a
 * fresh closure on every render is silently ignored. Wrap callbacks in
 * `useLatest` (or any stable ref) when you need them to read live state —
 * the high-level `<Vizel />` component does exactly this with its own props.
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
  const imageOptions = typeof features?.content?.image === "object" ? features.content.image : {};
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
    // Mount / instance state held in a closure-shared object so the async
    // initializer and the cleanup function can both observe the latest values
    // without mutable let bindings.
    const lifecycle: { isMounted: boolean; editorInstance: Editor | null } = {
      isMounted: true,
      editorInstance: null,
    };

    void (async () => {
      try {
        const result = await createVizelEditorInstance({
          ...opts.editorOptions,
          ...(opts.features !== undefined && { features: opts.features }),
          extensions: opts.additionalExtensions,
          createSlashMenuRenderer: createVizelSlashMenuRenderer,
        });

        if (!lifecycle.isMounted) {
          result.editor.destroy();
          return;
        }

        lifecycle.editorInstance = result.editor;
        setEditor(result.editor);
      } catch (error) {
        const vizelError = wrapAsVizelError(error, {
          context: "Editor initialization failed",
          code: "INVALID_CONFIG",
        });
        // Always emit to the consumer handler so observability sinks
        // (Sentry, log pipes) see configuration failures, *and* always
        // rethrow so global handlers / React error boundaries can react.
        // Suppressing the rethrow when a handler is set silently blanks the
        // editor whenever an `onError` is wired up purely for telemetry, so
        // the rethrow stays unconditional.
        opts.editorOptions.onError?.(vizelError);
        throw vizelError;
      }
    })();

    return () => {
      lifecycle.isMounted = false;
      lifecycle.editorInstance?.destroy();
    };
  }, []);

  // Handle vizel:upload-image custom event from slash command
  useEffect(() => {
    if (!editor) return;

    return registerVizelUploadEventHandler({
      getEditor: () => editor,
      getImageOptions: () => imageOptionsRef.current,
      // Reach the editor-level `onError` so an upload rejection emits a
      // `VizelError` (`UPLOAD_FAILED`) to observability sinks. Read the
      // latest value lazily because the consumer may reassign it.
      getOnError: () => optionsRef.current.editorOptions.onError,
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
