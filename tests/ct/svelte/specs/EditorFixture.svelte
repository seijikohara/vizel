<script lang="ts">
import { BubbleMenu, createVizelEditor, EditorContent, EditorRoot } from "@vizel/svelte";

interface Props {
  placeholder?: string;
  initialContent?: string;
  showBubbleMenu?: boolean;
}

let {
  placeholder = "Type something...",
  initialContent = undefined,
  showBubbleMenu = true,
}: Props = $props();

const editor = createVizelEditor({
  placeholder,
  initialContent,
  features: {
    mathematics: true,
  },
});
</script>

<EditorRoot editor={editor.current}>
  <EditorContent />
  {#if showBubbleMenu}
    <BubbleMenu />
  {/if}
</EditorRoot>
