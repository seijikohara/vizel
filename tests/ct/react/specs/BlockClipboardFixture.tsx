import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/react";
import { useEffect } from "react";

/**
 * Fixture for the block-aware clipboard scenarios (Section 11c).
 *
 * Exposes the editor on `window.vizelTestEditor` so the scenarios can
 * drive selection and dispatch synthetic clipboard events.
 */
export function BlockClipboardFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });
  useVizelState(editor);

  useEffect(() => {
    if (!editor) return;
    (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor = editor;
    return () => {
      delete (window as unknown as { vizelTestEditor?: unknown }).vizelTestEditor;
    };
  }, [editor]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
