<script lang="ts">
import { BubbleMenuDivider } from "@vizel/svelte";

interface Props {
  class?: string;
}

let { class: className }: Props = $props();
</script>

<BubbleMenuDivider class={className} />
