<script lang="ts">
import { createVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/svelte";

interface Props {
  placeholder?: string;
}

const props = $props<Props>();

const editor = createVizelEditor({
  placeholder: props.placeholder ?? "Type something...",
  features: {
    content: {
      mathematics: true,
    },
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
  <VizelBubbleMenu />
</VizelProvider>
