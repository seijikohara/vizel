<script lang="ts" module>
export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}
</script>

<script lang="ts">
import { VizelBubbleMenu, VizelEditor, VizelProvider, createVizelEditor } from "@vizel/svelte";

const props = $props<EmbedFixtureProps>();

// Resolve immediately so in-flight fetches never outlive the editor instance.
// The real oEmbed endpoint requires a network round-trip that the test
// environment does not make; a fast-resolving stub prevents the post-unmount
// dispatch that would otherwise produce an unhandled rejection.
const stubFetchEmbedData = (url: string) => Promise.resolve({ type: "link" as const, url });

const editor = createVizelEditor({
  placeholder: props.placeholder ?? "Type something...",
  initialContent: props.initialContent,
  features: {
    content: {
      embed: { fetchEmbedData: stubFetchEmbedData },
    },
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <VizelBubbleMenu enableEmbed />
</VizelProvider>
