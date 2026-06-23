<script lang="ts">
import type { JSONContent } from "@tiptap/core";
import { Vizel } from "@vizel/svelte";

interface Props {
  placeholder?: string;
  initialContent?: JSONContent;
  showBubbleMenu?: boolean;
}

const props = $props<Props>();
</script>

<Vizel
  placeholder={props.placeholder ?? "Type something..."}
  initialContent={props.initialContent}
  showBubbleMenu={props.showBubbleMenu ?? true}
/>
