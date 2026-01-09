<script lang="ts">
import { VizelBubbleMenuDivider } from "@vizel/svelte";

interface Props {
  class?: string;
}

let { class: className }: Props = $props();
</script>

<VizelBubbleMenuDivider class={className} />
