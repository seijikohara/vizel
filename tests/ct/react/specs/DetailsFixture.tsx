import { useVizelEditor, VizelEditor, VizelProvider } from "@vizel/react";

export interface DetailsFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

export function DetailsFixture({
  placeholder = "Type something...",
  initialContent,
}: DetailsFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    initialContent,
    features: {
      details: true,
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
    </VizelProvider>
  );
}
