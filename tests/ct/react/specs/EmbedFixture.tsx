import { useVizelEditor, VizelEditor, VizelProvider, VizelToolbar } from "@vizel/react";

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
      <VizelToolbar enableEmbed />
    </VizelProvider>
  );
}
