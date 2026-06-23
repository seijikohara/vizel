import {
  useVizelEditor,
  useVizelState,
  VizelEditor,
  VizelOutline,
  VizelProvider,
} from "@vizel/react";

export function OutlineFixture() {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });
  useVizelState(editor);

  const cursorPos = editor ? editor.state.selection.from : 0;

  return (
    <VizelProvider editor={editor}>
      <div data-testid="cursor-pos">{cursorPos}</div>
      <VizelOutline />
      <VizelEditor />
    </VizelProvider>
  );
}
