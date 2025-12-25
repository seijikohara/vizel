import {
  createVizelExtensions,
  defaultEditorProps,
  Editor,
  type Extensions,
  registerUploadEventHandler,
  resolveFeatures,
  type VizelEditorOptions,
} from "@vizel/core";
import { useEffect, useRef, useState } from "react";
import { createSlashMenuRenderer } from "./createSlashMenuRenderer.ts";

export interface UseVizelEditorOptions extends VizelEditorOptions {
  /** Additional extensions to include */
  extensions?: Extensions;
}

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
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}): Editor | null {
  const {
    initialContent,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    extensions: additionalExtensions = [],
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  const [editor, setEditor] = useState<Editor | null>(null);

  const resolvedFeatures = resolveFeatures({
    features,
    createSlashMenuRenderer,
  });

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};
  const imageOptionsRef = useRef(imageOptions);
  imageOptionsRef.current = imageOptions;

  // Store options in ref to avoid recreating editor on every render
  const optionsRef = useRef({
    initialContent,
    placeholder,
    editable,
    autofocus,
    resolvedFeatures,
    additionalExtensions,
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  });

  // Create editor on mount
  useEffect(() => {
    const opts = optionsRef.current;

    const instance = new Editor({
      extensions: [
        ...createVizelExtensions({
          placeholder: opts.placeholder,
          features: opts.resolvedFeatures,
        }),
        ...opts.additionalExtensions,
      ],
      content: opts.initialContent,
      editable: opts.editable,
      autofocus: opts.autofocus,
      editorProps: defaultEditorProps,
      // Only pass event handlers that are defined to avoid tiptap emit errors
      ...(opts.onUpdate && { onUpdate: opts.onUpdate }),
      ...(opts.onCreate && { onCreate: opts.onCreate }),
      ...(opts.onDestroy && { onDestroy: opts.onDestroy }),
      ...(opts.onSelectionUpdate && { onSelectionUpdate: opts.onSelectionUpdate }),
      ...(opts.onFocus && { onFocus: opts.onFocus }),
      ...(opts.onBlur && { onBlur: opts.onBlur }),
    });

    setEditor(instance);

    return () => {
      instance.destroy();
    };
  }, []);

  // Handle vizel:upload-image custom event from slash command
  useEffect(() => {
    if (!editor) return;

    return registerUploadEventHandler({
      getEditor: () => editor,
      getImageOptions: () => imageOptionsRef.current,
    });
  }, [editor]);

  return editor;
}
