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
    if (!editor) return undefined;
    window.vizelTestEditor = editor;
    window.vizelBlockOperationCommands = vizelBlockOperationCommands;
    return () => {
      delete window.vizelTestEditor;
      delete window.vizelBlockOperationCommands;
    };
  }, [editor]);

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
