import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export interface EditorFixtureProps {
  placeholder?: string;
  initialContent?: string;
  showBubbleMenu?: boolean;
}

export function EditorFixture({
  placeholder = "Type something...",
  initialContent,
  showBubbleMenu = true,
}: EditorFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    initialContent,
    features: {
      mathematics: true,
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      {showBubbleMenu && <VizelBubbleMenu />}
    </VizelProvider>
  );
}
