import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/react";

export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

// Resolve immediately so in-flight fetches never outlive the editor instance.
// The real oEmbed endpoint requires a network round-trip that the test
// environment does not make; a fast-resolving stub prevents the post-unmount
// `editor.chain()` call that would otherwise produce an unhandled rejection.
const stubFetchEmbedData = (url: string) => Promise.resolve({ type: "link" as const, url });

export function EmbedFixture({
  placeholder = "Type something...",
  initialContent,
}: EmbedFixtureProps) {
  const editor = useVizelEditor({
    placeholder,
    initialContent,
    features: {
      content: {
        embed: { fetchEmbedData: stubFetchEmbedData },
      },
    },
  });

  return (
    <VizelProvider editor={editor}>
      <VizelEditor />
      <VizelBubbleMenu enableEmbed />
    </VizelProvider>
  );
}
