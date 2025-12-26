<script lang="ts">
import { BubbleMenu, EditorContent, EditorRoot, useVizelEditor } from "@vizel/svelte";

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

const editor = useVizelEditor({
  placeholder,
  initialContent,
});
</script>

<EditorRoot editor={editor.current}>
  <EditorContent />
  {#if showBubbleMenu}
    <BubbleMenu />
  {/if}
</EditorRoot>
