import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export function EditorFixture() {
  const editor = useVizelEditor({
    placeholder: "Type something...",
    features: { content: { mathematics: true } },
  });
  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu />
    </VizelProvider>
  );
}
