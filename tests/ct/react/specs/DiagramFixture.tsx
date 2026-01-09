import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export interface DiagramFixtureProps {
  placeholder?: string;
  initialContent?: string;
  showBubbleMenu?: boolean;
}

export function DiagramFixture({
  placeholder = "Type something...",
  initialContent,
  showBubbleMenu = true,
}: DiagramFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    initialContent,
    features: {
      diagram: true,
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      {showBubbleMenu && <VizelBubbleMenu />}
    </VizelProvider>
  );
}
