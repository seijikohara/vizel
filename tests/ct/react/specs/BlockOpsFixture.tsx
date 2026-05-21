import {
  useVizelEditor,
  useVizelState,
  VizelEditor,
  VizelProvider,
  vizelBlockOperationCommands,
} from "@vizel/react";
import { useEffect } from "react";

export function BlockOpsFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });
  useVizelState(editor);

  useEffect(() => {
    if (!editor) return;
    const win = window as unknown as {
      vizelTestEditor?: unknown;
      vizelBlockOperationCommands?: unknown;
    };
    win.vizelTestEditor = editor;
    win.vizelBlockOperationCommands = vizelBlockOperationCommands;
    return () => {
      delete win.vizelTestEditor;
      delete win.vizelBlockOperationCommands;
    };
  }, [editor]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
