import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/react";

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
    <EditorRoot editor={editor}>
      <EditorContent />
      {showBubbleMenu && <BubbleMenu />}
    </EditorRoot>
  );
}
