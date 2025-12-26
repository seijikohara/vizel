import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/react";

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
  });

  return (
    <EditorRoot editor={editor}>
      <EditorContent />
      {showBubbleMenu && <BubbleMenu />}
    </EditorRoot>
  );
}
