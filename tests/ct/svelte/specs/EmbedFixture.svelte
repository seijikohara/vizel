<script lang="ts" module>
export interface EmbedFixtureProps {
  placeholder?: string;
  initialContent?: string;
}
</script>

<script lang="ts">
import { BubbleMenu, EditorContent, EditorRoot, createVizelEditor } from "@vizel/svelte";

let { placeholder = "Type something...", initialContent }: EmbedFixtureProps = $props();

const editor = createVizelEditor({
  placeholder,
  initialContent,
  features: {
    embed: true,
  },
});
</script>

<EditorRoot editor={editor.current}>
  <EditorContent />
  <BubbleMenu enableEmbed />
</EditorRoot>
