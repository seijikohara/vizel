import { useVizelEditor, useVizelState, VizelEditor, VizelProvider } from "@vizel/react";
import { useEffect } from "react";

export function BlockOpsFixture() {
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
