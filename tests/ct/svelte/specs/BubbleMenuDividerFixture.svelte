<script lang="ts">
import { VizelToolbarDivider } from "@vizel/svelte";

interface Props {
  class?: string;
}

let { class: className }: Props = $props();
</script>

<VizelToolbarDivider class={className} />
