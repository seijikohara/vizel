import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

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
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu enableEmbed />
    </VizelProvider>
  );
}
