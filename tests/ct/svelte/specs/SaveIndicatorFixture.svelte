<script lang="ts">
import { type SaveStatus, VizelSaveIndicator } from "@vizel/svelte";

interface Props {
  status: SaveStatus;
  lastSaved?: Date | null;
  showTimestamp?: boolean;
  class?: string;
}

let { status, lastSaved, showTimestamp, class: className }: Props = $props();
</script>

<VizelSaveIndicator
  {status}
  {lastSaved}
  {showTimestamp}
  class={className}
/>
