<script setup lang="ts">
import { useVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/vue";

export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}

const props = withDefaults(defineProps<EmbedFixtureProps>(), {
  placeholder: "Type something...",
});

// Resolve immediately so in-flight fetches never outlive the editor instance.
// The real oEmbed endpoint requires a network round-trip that the test
// environment does not make; a fast-resolving stub prevents the post-unmount
// dispatch that would otherwise produce an unhandled rejection.
const stubFetchEmbedData = (url: string) => Promise.resolve({ type: "link" as const, url });

const editor = useVizelEditor({
  placeholder: props.placeholder,
  initialContent: props.initialContent,
  features: {
    content: {
      embed: { fetchEmbedData: stubFetchEmbedData },
    },
  },
});
</script>

<template>
  <VizelProvider :editor="editor">
    <VizelEditor />
    <VizelBubbleMenu enable-embed />
  </VizelProvider>
</template>
