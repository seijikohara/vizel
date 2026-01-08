<script lang="ts">
import { createVizelEditor, VizelEditor, VizelProvider, VizelToolbar } from "@vizel/svelte";

interface Props {
  placeholder?: string;
  initialContent?: string;
  showBubbleMenu?: boolean;
}

const props = $props<Props>();

const editor = createVizelEditor({
  placeholder: props.placeholder ?? "Type something...",
  initialContent: props.initialContent,
  features: {
    mathematics: true,
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  {#if props.showBubbleMenu ?? true}
    <VizelToolbar />
  {/if}
</VizelProvider>
