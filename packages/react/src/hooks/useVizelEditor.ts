import { useEditor } from "@tiptap/react";
import { createVizelExtensions, type Extensions } from "@vizel/core";
import type { VizelEditorOptions, Editor } from "@vizel/core";

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
export function useVizelEditor(
  options: UseVizelEditorOptions = {}
): Editor | null {
  const {
    initialContent,
    placeholder,
    editable = true,
    autofocus = false,
    extensions: additionalExtensions = [],
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  const editor = useEditor({
    extensions: [
      ...createVizelExtensions({ placeholder }),
      ...additionalExtensions,
    ],
    content: initialContent,
    editable,
    autofocus,
    onUpdate,
    onCreate,
    onDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
    // Prevent SSR hydration issues
    immediatelyRender: false,
  });

  return editor;
}
