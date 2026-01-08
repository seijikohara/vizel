<script lang="ts" module>
export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}
</script>

<script lang="ts">
import { VizelToolbar, VizelEditor, VizelProvider, createVizelEditor } from "@vizel/svelte";

const props = $props<EmbedFixtureProps>();

const editor = createVizelEditor({
  placeholder: props.placeholder ?? "Type something...",
  initialContent: props.initialContent,
  features: {
    embed: true,
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <VizelToolbar enableEmbed />
</VizelProvider>
