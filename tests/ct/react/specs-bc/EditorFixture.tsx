import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export interface EditorFixtureProps {
  placeholder?: string;
}

export function EditorFixture({ placeholder = "Type something..." }: EditorFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    features: { content: { mathematics: true } },
  });
  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu />
    </VizelProvider>
  );
}
