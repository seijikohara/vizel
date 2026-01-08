<script lang="ts" module>
import type { VizelSaveStatus } from "@vizel/core";

export interface SaveIndicatorProps {
  /** Current save status */
  status: VizelSaveStatus;
  /** Timestamp of last successful save */
  lastSaved?: Date | null;
  /** Show relative timestamp (default: true) */
  showTimestamp?: boolean;
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
import { formatVizelRelativeTime } from "@vizel/core";
import { onMount } from "svelte";
import VizelIcon from "./VizelIcon.svelte";

let {
  status,
  lastSaved = null,
  showTimestamp = true,
  class: className,
}: SaveIndicatorProps = $props();

let relativeTime = $state("");

function updateTime() {
  if (lastSaved) {
    relativeTime = formatVizelRelativeTime(lastSaved);
  } else {
    relativeTime = "";
  }
}

onMount(() => {
  updateTime();
  const intervalId = setInterval(updateTime, 10000);

  return () => {
    clearInterval(intervalId);
  };
});

// Watch lastSaved changes
$effect(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  lastSaved;
  updateTime();
});

const statusText = $derived.by(() => {
  switch (status) {
    case "saved":
      return "Saved";
    case "saving":
      return "Saving...";
    case "unsaved":
      return "Unsaved";
    case "error":
      return "Error saving";
    default:
      return "";
  }
});

const shouldShowTimestamp = $derived(showTimestamp && lastSaved && relativeTime && status === "saved");
</script>

<div
  class="vizel-save-indicator vizel-save-indicator--{status} {className ?? ''}"
  role="status"
  aria-live="polite"
  data-vizel-save-indicator
>
  <span class="vizel-save-indicator-icon" aria-hidden="true">
    {#if status === "saved"}
      <VizelIcon name="check" />
    {:else if status === "saving"}
      <span class="vizel-save-indicator-spinner" aria-hidden="true">
        <VizelIcon name="loader" />
      </span>
    {:else if status === "unsaved"}
      <VizelIcon name="circle" />
    {:else if status === "error"}
      <VizelIcon name="warning" />
    {/if}
  </span>
  <span class="vizel-save-indicator-text">{statusText}</span>
  {#if shouldShowTimestamp}
    <span class="vizel-save-indicator-timestamp">{relativeTime}</span>
  {/if}
</div>
