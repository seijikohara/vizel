import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/react";

export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

export function EmbedFixture({
  placeholder = "Type something...",
  initialContent,
}: EmbedFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    initialContent,
    features: {
      embed: true,
    },
  });

  return (
    <EditorRoot editor={editor}>
      <EditorContent />
      <BubbleMenu enableEmbed />
    </EditorRoot>
  );
}
