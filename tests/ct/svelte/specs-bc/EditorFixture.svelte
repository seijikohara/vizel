<script lang="ts">
import { createVizelEditor, VizelBubbleMenu, VizelEditor, VizelProvider } from "@vizel/svelte";

const editor = createVizelEditor({
  placeholder: "Type something...",
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
