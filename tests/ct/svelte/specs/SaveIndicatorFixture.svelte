<script lang="ts">
import { SaveIndicator, type SaveStatus } from "@vizel/svelte";

interface Props {
  status: SaveStatus;
  lastSaved?: Date | null;
  showTimestamp?: boolean;
  class?: string;
}

let { status, lastSaved, showTimestamp, class: className }: Props = $props();
</script>

<SaveIndicator
  {status}
  {lastSaved}
  {showTimestamp}
  class={className}
/>
