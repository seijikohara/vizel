import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/react";
import { useEffect } from "react";

/**
 * Fixture for the block-aware clipboard scenarios.
 *
 * Expose the editor on `window.vizelTestEditor` so the scenarios drive
 * selection and dispatch synthetic clipboard events.
 */
export function BlockClipboardFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });
  useVizelState(editor);

  useEffect(() => {
    if (!editor) return undefined;
    window.vizelTestEditor = editor;
    return () => {
      delete window.vizelTestEditor;
    };
  }, [editor]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
